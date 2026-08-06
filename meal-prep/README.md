# Weekly meal-prep planner — state

This folder is just persistent state for a recurring Claude task, not part of
the public site. It tracks what's already been cooked and taught so future
weeks don't repeat meals, cuisines, or techniques.

- `history.json` — standing preferences (macros, allergies, likes/dislikes,
  budget, stores) plus a log of every week's menu, cuisines, and the
  cuisine/technique taught that week.
- `weeks/` — full markdown record of each week's plan (menu, macros, cost,
  7-day grid, shopping list, recipes).

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

Open items to confirm with the user (see `history.json.preferences` notes):
- Whether the 2170 cal / 125g protein target is per day (assumed) or per meal.
- The actual weekly restock item (defaulted to eggs, unconfirmed).
