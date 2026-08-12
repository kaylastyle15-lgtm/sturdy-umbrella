function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT id, name, email, message, created_at FROM answers ORDER BY id DESC'
  ).all();

  const rows = results
    .map(
      (r) => `<tr>
        <td>${r.id}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.email)}</td>
        <td>${escapeHtml(r.message)}</td>
        <td>${escapeHtml(r.created_at)}</td>
      </tr>`
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Answers</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 60rem; margin: 3rem auto; padding: 0 1rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
</style>
</head>
<body>
  <h1>Submitted Answers</h1>
  <p><a href="/">Back to form</a></p>
  <table>
    <thead>
      <tr><th>ID</th><th>Name</th><th>Email</th><th>Message</th><th>Submitted At</th></tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="5">No submissions yet.</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
