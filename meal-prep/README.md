# Weekly meal-prep planner — state

This folder is just persistent state for a recurring Claude task, not part of
the public site. It tracks what's already been cooked and taught so future
weeks don't repeat meals, cuisines, or techniques.

- `history.json` — standing preferences (macros, allergies, likes/dislikes,
  budget, stores) plus a log of every week's menu, cuisines, and the
  cuisine/technique taught that week.
- `weeks/` — full HTML record of each week's plan (menu, macros, cost,
  7-day grid, shopping list, recipes). The shopping list is an interactive
  checklist (tap to check off, saved via localStorage per page, per-store
  reset button, live progress counter) — keep that pattern in future weeks.

Each run:
1. Reads `history.json`, avoids repeating last week's 4 dinners, and picks a
   cuisine/technique not yet in `cuisines_taught_so_far` /
   `techniques_taught_so_far` where possible.
2. Builds each dinner as an adaptation of a specific, well-reviewed published
   recipe (NYT Cooking, Bon Appétit, Serious Eats, America's Test Kitchen,
   Once Upon a Chef, etc. — sites with real recipe testing and reader
   reviews, not random blogspam) — never written from scratch with no
   source. Cites the source and lists what was changed (protein swaps for
   likes/dislikes, lactose-friendly substitutions, scaling to 2 servings).
3. Web-searches current prices for the user's zip (07657) where possible to
   ground the shopping list; estimates are explicitly flagged as such.
4. Builds the new week's plan and delivers it as an artifact to the user.
5. Appends the new week to `history.json` and adds a file under `weeks/`,
   then commits and pushes.

She added the artifact to her phone's home screen as a permanent app icon.
Every week MUST republish to that same URL (`history.json.landing_artifact_url`,
passed as the `url` param to the Artifact tool) rather than minting a new
link, so the icon always opens to the current week. Still keep a dated copy
under `weeks/` for history.

Resolved:
- 2170 cal / 125g protein is a confirmed daily target.
- Restocking is inferred, not a fixed item: assume salt, pepper, olive oil, and
  common dried seasonings are always on hand (never list them). Each week,
  infer what's likely run low from the *previous* week's dinners (a spice jar
  that got fully used, a produce item, etc.) and add just that. Eggs are a
  standing weekly add regardless, since her supply runs low.
