/* ============================================================================
   /api/match — THE MATCHER. This is the heart of the app.
   ----------------------------------------------------------------------------
   It is built in TWO CLEARLY SEPARATED LAYERS. Read them in order:

     ┌───────────────────────────────────────────────────────────────────┐
     │  LAYER 1 — THE RULES (the safety net). Plain code. No AI, no key.  │
     │  Hard filters ("never match if…"), a score over shared answers,   │
     │  a ranking, and one-match-per-person. This ALWAYS runs and always │
     │  works, even with no API key.                                     │
     ├───────────────────────────────────────────────────────────────────┤
     │  LAYER 2 — THE AI (the judgment). Optional. Sends the rule-passed  │
     │  candidates to Claude for a smarter pick + a warmer reason.        │
     │  If there is NO API key (or the AI errors), we quietly fall back   │
     │  to Layer 1's pick. The app never breaks.                         │
     └───────────────────────────────────────────────────────────────────┘

   Calling this more than once is safe: once you have a match, you get the
   SAME match back (no double-booking).
   ============================================================================ */

/* ====================  HARD SAFETY RULES (edit these!)  ====================
   These are COPYABLE EXAMPLES. Real matching apps need blocks like these:
   allergy blocks, age-gap limits, opposing-values blocks. A hard rule returns
   false to say "these two must NEVER be matched", no matter how well they
   score. Rules beat scores, always.
   ========================================================================== */
const MIN_AGE = 16;      // AGE GATE: nobody under this age gets matched.
const MAX_AGE_GAP = 10;  // AGE GAP: never pair people more than this many years apart.

const HARD_RULES = [
  // Rule 1 — AGE GATE: both people must be at least MIN_AGE.
  (me, them) => me.age >= MIN_AGE && them.age >= MIN_AGE,

  // Rule 2 — AGE GAP: keep partners within MAX_AGE_GAP years of each other.
  (me, them) => Math.abs(me.age - them.age) <= MAX_AGE_GAP,

  // Rule 3 — MUST-NEVER (opposing values): never pair a food-first fairgoer
  // with a rollercoaster-first one — they'll want to do totally different
  // things all day. This reads the "firstThing" answer from questions.js.
  (me, them) => !isOpposite(me.answers.firstThing, them.answers.firstThing),
];
function isOpposite(a, b) {
  return (a === "Grab food" && b === "Ride something") || (a === "Ride something" && b === "Grab food");
}

/* ==========================  ENTRY POINT  ================================= */
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request." }, 400); }
  const meId = Number(body.profileId);
  if (!meId) return json({ error: "Missing profileId." }, 400);

  const me = await getProfile(env, meId);
  if (!me) return json({ error: "We couldn't find your profile." }, 404);

  // ONE MATCH PER PERSON: if you already have a match, return it (don't remake).
  const existing = await env.DB.prepare(
    `SELECT * FROM matches WHERE profile_a = ? OR profile_b = ? LIMIT 1`
  ).bind(meId, meId).first();
  if (existing) return json(await renderMatch(env, existing, meId));

  // Gather everyone who is (a) not you and (b) not already matched to someone.
  const candidates = await getAvailableCandidates(env, meId);

  /* ----------  LAYER 1: THE RULES (safety net)  ---------- */
  const ranked = rankByRules(me, candidates); // hard-filter + score + sort
  if (ranked.length === 0) {
    return json({ status: "waiting", reason: "No one is free to match with yet. As more people join, we'll pair you automatically." });
  }
  const rulePick = ranked[0];                     // best by score
  const ruleReason = buildRuleReason(me, rulePick); // plain-language "why"

  /* ----------  LAYER 2: THE AI (judgment, optional)  ---------- */
  // Default to the rule result, then let AI improve it IF a key is configured.
  let buddy = rulePick;
  let reason = ruleReason;
  let source = "rule";

  if (env.ANTHROPIC_API_KEY) {
    const ai = await askClaude(env, me, ranked).catch(() => null);
    // Only trust the AI if it returned a candidate that actually passed the rules.
    const chosen = ai && ranked.find((c) => c.id === ai.buddyId);
    if (chosen) {
      buddy = chosen;
      reason = ai.reason || ruleReason;
      source = "ai";
    }
    // If ai is null/invalid we silently keep the rule pick above. App still works.
  }

  // Save the match. profile_a = requester, profile_b = the buddy.
  const created = await env.DB.prepare(
    `INSERT INTO matches (profile_a, profile_b, score, reason, source, status)
     VALUES (?, ?, ?, ?, ?, 'matched') RETURNING *`
  ).bind(meId, buddy.id, buddy._score, reason, source).first();

  // NOTIFICATION STUB: pretend to email both people. (See notify.js — it does
  // not send real email unless you wire in a provider. Fire-and-forget.)
  notifyOnMatch(env, me, buddy, reason).catch(() => {});

  return json(await renderMatch(env, created, meId));
}

/* ============================  LAYER 1 HELPERS  ============================ */

// Hard-filter the pool, score whoever survives, and sort best-first.
function rankByRules(me, candidates) {
  return candidates
    .filter((them) => HARD_RULES.every((rule) => rule(me, them))) // ALL rules must pass
    .map((them) => ({ ...them, _score: ruleScore(me, them) }))
    .sort((a, b) => b._score - a._score);
}

// Score = how much two people's answers overlap. Generic: it works no matter
// what questions you put in questions.js.
//   - same single-choice answer  -> +2
//   - each shared multi-select item -> +1
function ruleScore(me, them) {
  let score = 0;
  for (const key of Object.keys(me.answers)) {
    const a = me.answers[key];
    const b = them.answers[key];
    if (b === undefined) continue;
    if (key === "activities" && Array.isArray(a) && Array.isArray(b)) score += a.filter((x) => b.includes(x)).length * 3; // shared fair activities matter most
    if (Array.isArray(a) && Array.isArray(b)) {
      score += a.filter((x) => b.includes(x)).length; // +1 per shared item
    } else if (a === b) {
      score += 2;                                      // +2 for an exact match
    }
  }
  return score;
}

// Turn the overlap into a sentence a student understands. Generic (no question
// text needed), so it keeps working when you swap the survey.
function buildRuleReason(me, them) {
  const shared = [];
  for (const key of Object.keys(me.answers)) {
    const a = me.answers[key], b = them.answers[key];
    if (b === undefined) continue;
    if (Array.isArray(a) && Array.isArray(b)) shared.push(...a.filter((x) => b.includes(x)));
    else if (a === b) shared.push(a);
  }
  if (shared.length) return `You two line up on: ${[...new Set(shared)].join(", ")}.`;
  return "No overlapping answers, but you both cleared the safety checks — a fresh perspective can be a great study match.";
}

/* ============================  LAYER 2 HELPER  ============================ */

// Ask Claude to pick the best buddy and explain why, in plain language.
// Uses the fast + cheap Haiku model. Reads the key from a Cloudflare SECRET
// (env.ANTHROPIC_API_KEY) — the key is NEVER written in this code.
async function askClaude(env, me, candidates) {
  const applicant = { name: me.name, age: me.age, answers: me.answers };
  const options = candidates.map((c) => ({ id: c.id, name: c.name, age: c.age, answers: c.answers, ruleScore: c._score }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",   // fast + inexpensive
      max_tokens: 300,
      system:
        "You match people for the Iowa State Fair. The candidates you are given " +
        "ALREADY passed every safety rule — never invent new ones and only " +
        "choose from the provided list. Pick the single best fair buddy for " +
        "the applicant and explain why in ONE warm, plain sentence a person " +
        'would understand. Reply with ONLY JSON: {"buddyId": <number>, "reason": "<sentence>"}.',
      messages: [
        { role: "user", content: JSON.stringify({ applicant, candidates: options }) },
      ],
    }),
  });
  if (!res.ok) throw new Error("AI call failed: " + res.status);
  const data = await res.json();
  const text = (data.content || []).map((b) => b.text || "").join("");
  const match = text.match(/\{[\s\S]*\}/); // pull the JSON object out of the reply
  if (!match) throw new Error("AI reply had no JSON");
  const parsed = JSON.parse(match[0]);
  return { buddyId: Number(parsed.buddyId), reason: String(parsed.reason || "") };
}

/* =============================  NOTIFICATION STUB  ========================= */
// Would email both people that they've been matched. Kept here as a fire-and-
// forget call; the real composing/sending lives in notify.js (documented, and
// safe to run with no email provider configured).
async function notifyOnMatch(env, me, buddy, reason) {
  // We just log what WOULD be sent. To send for real, see notify.js.
  console.log("MATCH NOTIFY:", { to: [me.email, buddy.email], reason });
}

/* ==============================  SHARED HELPERS  =========================== */

async function getProfile(env, id) {
  const row = await env.DB.prepare(`SELECT * FROM profiles WHERE id = ?`).bind(id).first();
  if (!row) return null;
  row.answers = JSON.parse(row.answers || "{}");
  return row;
}

// Everyone who is not me and not already in a match row.
async function getAvailableCandidates(env, meId) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM profiles
     WHERE id != ?
       AND id NOT IN (SELECT profile_a FROM matches UNION SELECT profile_b FROM matches)`
  ).bind(meId).all();
  return (results || []).map((r) => ({ ...r, answers: JSON.parse(r.answers || "{}") }));
}

// Build the response the browser shows on the result screen.
async function renderMatch(env, match, meId) {
  const buddyId = match.profile_a === meId ? match.profile_b : match.profile_a;
  const buddy = await env.DB.prepare(`SELECT id, name FROM profiles WHERE id = ?`).bind(buddyId).first();
  return {
    status: match.status,          // "matched" or "confirmed"
    source: match.source,          // "rule" or "ai"
    score: match.score,
    reason: match.reason,
    buddy: { id: buddy.id, name: buddy.name },
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
