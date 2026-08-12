export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const message = (body.message || '').trim();

  if (!name || !email || !message) {
    return new Response('Missing required fields', { status: 400 });
  }

  await env.DB.prepare(
    'INSERT INTO answers (name, email, message) VALUES (?, ?, ?)'
  )
    .bind(name, email, message)
    .run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
