/* ============================================================================
   /api/organizer — the whole picture for whoever runs the event.
   ----------------------------------------------------------------------------
   Returns everyone in the pool and every match so far (with message counts).
   NOTE: this is wide-open on purpose so it's easy to demo. In a real app you
   would put it behind a login — the README shows where.
   ============================================================================ */

export async function onRequestGet(context) {
  const { env } = context;

  // Everyone who has signed up.
  const profiles = (await env.DB.prepare(`SELECT * FROM profiles ORDER BY id ASC`).all()).results || [];

  // Which profile IDs are already matched (so we can label them).
  const matchedIds = new Set();
  const matchesRaw = (await env.DB.prepare(`SELECT * FROM matches ORDER BY id ASC`).all()).results || [];
  matchesRaw.forEach((m) => { matchedIds.add(m.profile_a); matchedIds.add(m.profile_b); });

  // Name lookup + message counts per match.
  const nameById = Object.fromEntries(profiles.map((p) => [p.id, p.name]));
  const counts = (await env.DB.prepare(
    `SELECT match_id, COUNT(*) AS n FROM messages GROUP BY match_id`
  ).all()).results || [];
  const countByMatch = Object.fromEntries(counts.map((c) => [c.match_id, c.n]));

  return json({
    profiles: profiles.map((p) => ({
      id: p.id, name: p.name, email: p.email, age: p.age,
      answers: JSON.parse(p.answers || "{}"),
      matched: matchedIds.has(p.id),
    })),
    matches: matchesRaw.map((m) => ({
      id: m.id,
      a_name: nameById[m.profile_a] || ("#" + m.profile_a),
      b_name: nameById[m.profile_b] || ("#" + m.profile_b),
      reason: m.reason,
      source: m.source,
      status: m.status,
      message_count: countByMatch[m.id] || 0,
    })),
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
