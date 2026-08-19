/* ============================================================================
   /api/messages — the conversation between two matched people.
   ----------------------------------------------------------------------------
   GET  /api/messages?profileId=123  -> the whole thread for that person.
   POST /api/messages  {profileId, body}  -> add a message, mark match confirmed.
   Sending the first message flips the match status from "matched" to
   "confirmed" — that's how the "status" in the result screen changes.
   ============================================================================ */

// Read the thread.
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const meId = Number(url.searchParams.get("profileId"));
  if (!meId) return json({ error: "Missing profileId." }, 400);

  const match = await findMatch(env, meId);
  if (!match) return json({ matchId: null }); // no match yet — nothing to show

  const buddyId = match.profile_a === meId ? match.profile_b : match.profile_a;
  const buddy = await env.DB.prepare(`SELECT name FROM profiles WHERE id = ?`).bind(buddyId).first();

  const { results } = await env.DB.prepare(
    `SELECT id, sender_id, body, created_at FROM messages WHERE match_id = ? ORDER BY id ASC`
  ).bind(match.id).all();

  return json({
    matchId: match.id,
    status: match.status,
    buddyName: buddy ? buddy.name : "your buddy",
    messages: results || [],
  });
}

// Send a message.
export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request." }, 400); }

  const meId = Number(body.profileId);
  const text = (body.body || "").trim();
  if (!meId || !text) return json({ error: "Missing message." }, 400);

  const match = await findMatch(env, meId);
  if (!match) return json({ error: "You don't have a match yet." }, 404);

  // Save the message...
  await env.DB.prepare(
    `INSERT INTO messages (match_id, sender_id, body) VALUES (?, ?, ?)`
  ).bind(match.id, meId, text).run();

  // ...and mark the match "confirmed" now that people are talking.
  await env.DB.prepare(`UPDATE matches SET status = 'confirmed' WHERE id = ?`).bind(match.id).run();

  return json({ ok: true });
}

// Find the one match this person belongs to (as requester or buddy).
async function findMatch(env, meId) {
  return env.DB.prepare(
    `SELECT * FROM matches WHERE profile_a = ? OR profile_b = ? LIMIT 1`
  ).bind(meId, meId).first();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
