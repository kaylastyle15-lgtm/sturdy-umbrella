/* ============================================================================
   /api/notify — NOTIFICATION STUB (documented; does not send real email).
   ----------------------------------------------------------------------------
   WHAT THIS IS: when two people match, you probably want to EMAIL them both:
   "You've been matched with ___! Here's why, and here's how to say hi."

   WHY IT'S A STUB: sending real email needs an email service (and an account,
   a domain, and an API key). So this endpoint COMPOSES the two emails and
   returns them as JSON — a safe "dry run" you can see working immediately,
   with no account required. When you're ready, drop your provider's send call
   where the comment says TO SEND FOR REAL.

   Try it:  POST /api/notify  { "matchId": 1 }
   ============================================================================ */

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request." }, 400); }
  const matchId = Number(body.matchId);
  if (!matchId) return json({ error: "Missing matchId." }, 400);

  // Look up the pair + reason.
  const m = await env.DB.prepare(`SELECT * FROM matches WHERE id = ?`).bind(matchId).first();
  if (!m) return json({ error: "No such match." }, 404);
  const a = await env.DB.prepare(`SELECT name, email FROM profiles WHERE id = ?`).bind(m.profile_a).first();
  const b = await env.DB.prepare(`SELECT name, email FROM profiles WHERE id = ?`).bind(m.profile_b).first();

  // Compose one email for each person.
  const emails = [
    buildEmail(a, b, m.reason),
    buildEmail(b, a, m.reason),
  ];

  /* ----------  TO SEND FOR REAL  ----------
     Uncomment and add a provider. Example with Resend (https://resend.com):

     for (const mail of emails) {
       await fetch("https://api.resend.com/emails", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           "Authorization": "Bearer " + env.RESEND_API_KEY,   // a Cloudflare secret
         },
         body: JSON.stringify({
           from: "Study Buddy <hi@yourdomain.com>",
           to: mail.to,
           subject: mail.subject,
           text: mail.text,
         }),
       });
     }
     ---------------------------------------- */

  // Dry run: just return what WOULD be sent so you can see it works.
  return json({ sent: false, note: "Dry run — no email provider configured. See notify.js.", emails });
}

function buildEmail(to, buddy, reason) {
  return {
    to: to.email,
    subject: `You've been matched with ${buddy.name}!`,
    text:
      `Hi ${to.name},\n\n` +
      `Good news — you've been matched with ${buddy.name}.\n` +
      `Why you two: ${reason}\n\n` +
      `Open the app to say hi and plan your first session.\n\n— Study Buddy`,
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
