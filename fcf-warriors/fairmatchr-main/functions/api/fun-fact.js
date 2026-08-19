/* ============================================================================
   /api/fun-fact — ONE optional example of calling a FREE public API.
   ----------------------------------------------------------------------------
   WHAT IT IS: a "door" showing how a Function can pull live data from the
   internet — here, a random fun fact you could use as an icebreaker between
   matched people ("Break the ice: did you know…").

   WHEN YOU'D USE THIS PATTERN: pulling weather, quotes, holidays, exchange
   rates — anything from an outside service. Swap the URL below for any free
   API you like.

   IT IS NOT wired into the core matching flow on purpose — it's a demonstrated
   door you can choose to walk through, not a load-bearing wall.

   Try it:  GET /api/fun-fact
   ============================================================================ */

export async function onRequest(context) {
  try {
    // A free, no-key public API. (If it's ever down, we fall back below.)
    const res = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en", {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) throw new Error("upstream " + res.status);
    const data = await res.json();
    return json({ fact: data.text, source: "uselessfacts.jsph.pl" });
  } catch {
    // Always degrade gracefully — never let an outside service break your app.
    return json({ fact: "Honey never spoils — archaeologists have eaten 3,000-year-old honey.", source: "fallback" });
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
