/* ==========================================================================
   /api/signup  — create (or update) a person's profile in the database.
   --------------------------------------------------------------------------
   This is a Cloudflare Pages Function. The file's location IS its web address:
     functions/api/signup.js  ->  https://YOURAPP.pages.dev/api/signup
   "onRequestPost" runs when the browser sends a POST. The database is handed
   to us as context.env.DB (the D1 binding named in wrangler.jsonc).
   ========================================================================== */

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1) Read what the sign-up form sent us.
  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Could not read the form data." }, 400); }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const age = Number(body.age);
  const answers = body.answers || {};

  // 2) Basic checks. (The age GATE that blocks bad *matches* lives in match.js;
  //    here we just make sure the data is sane before saving.)
  if (!name || !email) return json({ error: "Please add your name and email." }, 400);
  if (!Number.isFinite(age) || age < 10 || age > 120) return json({ error: "Please enter a real age." }, 400);

  // 3) Save. If this email already signed up, update their answers instead of
  //    erroring — friendlier for a class where people re-submit.
  const answersJson = JSON.stringify(answers);
  const row = await env.DB.prepare(
    `INSERT INTO profiles (name, email, age, answers)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET name = excluded.name, age = excluded.age, answers = excluded.answers
     RETURNING id, name`
  ).bind(name, email, age, answersJson).first();

  return json({ id: row.id, name: row.name });
}

// Small helper so every response is JSON with the right header.
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
