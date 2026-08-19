# Study Buddy Matcher

> **PROGRESS:** ✅ Reference app is built, deployed, and working — now with an app-like, step-by-step sign-up flow, a top bar + bottom tabs, and every screen wired up (rule-based matching, no API key needed). **NEXT for your group:** clone this repo, then start at [Make it yours → Step 1](#step-1-identity--design). Update this line whenever you finish a step so whoever picks it up next knows exactly where things stand.

A working matching app you **clone and make your own**. A person signs up, answers a few questions, gets matched with a study buddy, sees *why*, and starts a conversation. It runs on the free tiers of Cloudflare.

**Live reference:** https://studybuddy-matcher.pages.dev
(Sign up once and you'll see "waiting" — you're the only person. Sign up again with a different email on another phone/browser and watch a match happen.)

---

## What this app is (in plain words)

- A **website** that also **installs on a phone** like an app (that's a "PWA" — a web page with an icon and offline support).
- It's a **single-page app**: one page that swaps screens in place — a step-by-step sign-up, your match, the chat, the organizer — with a top bar and bottom tabs that stay put, so it feels like a real app.
- It stores people, matches, and messages in a **database** (Cloudflare D1, which is just SQLite — a single-file database).
- The matching happens in **two layers**:
  - **Rules** — plain code with a safety net (never match certain people; score by shared answers). Works with no setup.
  - **AI** — an optional smarter pick + friendlier explanation from Claude. Turns on only when you add a key. If it's off or errors, the app quietly uses the rules. **Nothing breaks.**

---

## The files (where everything lives)

```
study-buddy-matcher/
├── README.md              ← you are here (the teacher)
├── wrangler.jsonc         ← Cloudflare settings (project name, database link)
├── schema.sql             ← the database shape: profiles, matches, messages
├── package.json           ← handy shortcut commands (npm run ...)
│
├── public/                ← everything the browser sees (the front of the app)
│   ├── index.html         ← the app shell: top bar, the screen, bottom tabs
│   ├── app.js             ← ⭐ THE APP — the sign-up flow + all four screens
│   ├── questions.js       ← ⭐ THE QUESTIONS — change your survey here
│   ├── theme.css          ← ⭐ THE DESIGN — colors, fonts, feel, all in one place
│   ├── styles.css         ← layout for the app shell (rarely needs editing)
│   ├── result.html / chat.html / organizer.html ← tiny redirects that send old
│   │                         links into the app (e.g. /organizer → the app)
│   ├── manifest.json      ← PWA info (name, colors, icons)
│   ├── sw.js              ← service worker (makes it installable/offline)
│   └── icon.svg / icon-192.png / icon-512.png ← the app icon
│
└── functions/api/         ← the back of the app (runs on Cloudflare's servers)
    ├── signup.js          ← saves a person
    ├── match.js           ← ⭐ THE MATCHER — rules + AI, clearly split
    ├── messages.js        ← the chat (read thread / send message)
    ├── notify.js          ← "email both people" stub (documented; no email needed)
    ├── organizer.js       ← everyone + every match
    └── fun-fact.js        ← ONE optional example of calling a free public API
```

Each file in `functions/api/` becomes a web address automatically:
`functions/api/match.js` → `/api/match`. That's how Cloudflare Pages works.

---

## Run it on your computer first

You need [Node.js](https://nodejs.org) (version 20+). Then:

```bash
npm install          # one time (installs the Cloudflare tool)
npm run dev          # starts the app at http://localhost:8788
```

`npm run dev` runs the whole thing locally — pages **and** the database-backed
functions. Open the address it prints. (It uses a **local** copy of the
database, so you won't touch the live one while experimenting.)

---

## Learning instructions

You cloned this app. Your job is to turn it into your **own** matching app. This section is the guide: first **understand** this app, then **plan** yours, then read **your group's block**. You do the hands-on building in **[Make it yours](#make-it-yours)** below.

You'll do most of this by talking to **Claude Code** — the tool where you type a request in plain English and it reads the files, answers you, or makes the change. The prompts below are made to be **copied and pasted in**. Paste one, read the answer, then ask a follow-up in your own words.

**One rule: ask before you cut.** Have Claude Code explain a file first, then change one thing, then check it in the running app. Small steps you understand beat big steps you don't.

### Part 1 — Starter prompts to understand this app

Paste each into Claude Code. The note after each says why it helps.

- **"Explain how the matching works in this app, in plain words."** — the big picture before any detail.
- **"Walk me through what happens, step by step, when someone signs up."** — follows one person from the form to a match.
- **"Show me where the questions live and how I change them."** — points you at `questions.js`, the file you'll edit most.
- **"Explain the difference between the rule match and the AI match, and when each one runs."** — the two layers, and why the app works with no AI key at all.
- **"In `match.js`, show me the hard rules and explain what each one blocks."** — the safety net: the age gate, the age gap, the opposing-values block.
- **"Explain the score in `ruleScore` — what earns points, and how many?"** — how the app decides who fits best.
- **"Where are people's answers stored, and how do I see them?"** — the database, and the `/organizer` page that lists everyone.
- **"What is the `status` on a match, and when does it change?"** — how a match goes from *matched* to *confirmed*, and how the screen follows.
- **"How do I run this on my own computer, and how do I put it live?"** — dev and deploy, before you touch anything.
- **"Don't change anything yet — just tell me the one file I'd edit to [the thing you want to do]."** — learn the map before you cut.

### Part 2 — Starter prompts to plan your own

- **"I am building [your app in one sentence]. Here are my questions: [paste them]. Compared to study-buddy, what do I change, and what can I keep?"** — the whole plan in one prompt.
- **"What is the one field my match should turn on, and where in the code does that decision live?"** — finds your version of "same subject."
- **"What is a rule my app must never break, and how do I add it as a hard filter like the age gate?"** — turns a safety promise into a real block.
- **"Rewrite the `questions.js` list for my app using these questions: [paste them]."** — then check it in the running app.
- **"My match should rank [what matters most] highest. Show me the exact line in `ruleScore` to change."** — one change, one place.
- **"Do I actually need an outside data source for this, or can I fake it for a good demo?"** — an honest gut-check (see Part 4).

### Part 3 — Your group's guide

Find your group. Each block says: **what you're building**, **what you change**, **what this template already shows you** (so you're not starting from a blank page), and **what to research**.

**1. Green Italian — music taste**
- **Your app:** matches people by music taste and listening history.
- **Questions:** childhood song, all-time favorite, on-repeat right now, a genre you can't stand, personal theme song.
- **You change:** swap the questions in `questions.js`, then score on shared taste. A shared genre already earns points the same way "same subject" does today.
- **Template shows you:** `questions.js` (every question lives here) and `ruleScore` in `match.js` (where a shared answer becomes points).
- **Research:** how to compare **free-text** taste — two people can type the same idea in different words ("Beatles" vs "the beatles"), and an exact-match score misses that. Also a music service for real songs and artists.
- **API to check — Spotify Web API** (free tier; has artists, genres, tracks). Honest test: free? yes. Has the data? yes. Fits your app? check the sign-in step *before* you wire it in.

**2. Paper Chasers — music taste**
- **Your app:** matches people by music taste.
- **Questions:** favorite genre, top 3 artists, go-to sad song, cheer-up song, lyrics vs melody.
- **The "never" rule:** never connect different eras, and never match two people just because they both named the same obvious top-two artist in a genre.
- **You change:** the match must **down-rank the obvious, popular overlaps** — a rare shared taste should beat "we both like the #1 artist." That's an edit to `ruleScore` (give the obvious picks fewer points), plus a hard "different eras" block.
- **Template shows you:** `ruleScore` (where you add or hold back points) and `HARD_RULES` / `isOpposite` in `match.js` (copy that shape for the "different eras" block).
- **Research:** the same music-API idea (Spotify) — you need popularity data to know which artists are "the obvious ones."

**3. Sports Buddies — sports fans (national)**
- **Your app:** matches sports fans across the country.
- **Questions:** favorite sports, teams, players, games you're attending, location, willing to travel, age.
- **The "never" rules:** never pair different sports (unless a human okays it), never a huge age gap, never an under-18 with an adult.
- **Template already has your age rules built:** `MIN_AGE` and `MAX_AGE_GAP` in `match.js` are your age-gap rule and your under-age rule already working — edit the numbers, or copy the age-gate rule to make the under-18-with-an-adult version. The "different sports" block is one new `HARD_RULE` that compares the `sport` answer (copy the opposing-values rule).
- **Research:** a sports data service (teams, schedules).
- **API to check — a free sports API such as balldontlie or TheSportsDB.** Honest test: free? does it have your teams and schedules? does it fit?

**4. FCF Warriors — Iowa State Fair personality match**
- **Your app:** matches people by their State Fair personality.
- **Questions:** first thing you do at the fair, favorite rides, fair food, prizes, favorite memory.
- **The "never" rule:** never pair a food-first person with a rollercoaster-first person.
- **You change:** score on shared preferences (the default already does this), and add that one hard "never."
- **Template shows you:** the opposing-values rule (`isOpposite`, Casual vs Intense) is exactly your food-first vs rides-first block — copy it and compare the "first thing at the fair" answer.
- **Research:** none. This is a questions-and-scoring change. **No API needed.**

**5. Batman — GameMatch (pickup games)**
- **Your app:** matches people for pickup games nearby.
- **Questions:** sport, skill level, location, availability, casual vs competitive.
- **The "never" rule:** never match a beginner with an advanced player in a **competitive** game.
- **Template shows you:** the opposing-values rule (`isOpposite`) is the shape of your beginner-vs-advanced block (it reads two answers at once — skill *and* competitive). And the **`status` field** plus the **conversation feature** already solve "nobody is left waiting": a match is *matched* until someone says hi, then *confirmed*, and the "Waiting for a buddy" screen holds people who aren't paired yet.
- **Components to research:** skill-level matching, a schedule/availability match, notifications, and a status field so nobody is left waiting (you already have a working example of that last one).
- **API to check — a free maps or places API** to match people by area. Honest test: free? does it give you locations/distance? worth it for your demo?

**6. The AI Fools — Ice Cream Bowl (flavor match with allergy safety)**
- **Your app:** matches people to ice cream flavors, safely.
- **Questions:** allergies (with a follow-up for *which* allergy), taste profile, toppings ranked, adventurous yes/no, open to changing your mind yes/no.
- **The "never" rule:** never match someone to a flavor they're allergic to.
- **Template already shows you the two hardest parts:**
  - a **branching question** — the `mode` question (Online → *which platform?*) is exactly the shape of "Any allergies? → *which one?*." Copy it.
  - a **hard safety filter** — the age gate is exactly the shape of "block any flavor with that allergen." Copy it.
- **Research:** none needed — it's questions plus one hard filter.

**7. Frozen Team — Dream Jobs (job seekers to ethical employers)**
- **Your app:** matches job seekers with employers that fit their values.
- **Questions:** where you want to work, core values, experience, salary needs, deal-breakers.
- **The "never" rules:** never match on opposing values, and never a company someone had a bad experience with.
- **Yours is the fuzzy match** — "good fit" and "shared values" are judgment calls a plain rule can't make. That's what the **AI match** in `match.js` is for. Turn it on ([Step 3](#step-3--the-match-the-important-one)); it needs the `ANTHROPIC_API_KEY`. Keep the hard "never" rules in `HARD_RULES` (copy the opposing-values rule for values, and a deal-breaker block for the bad-experience company); let the AI do the softer judging on top.
- **Research + API (this is the API group):** real job openings and company info.
- **APIs to check — USAJobs API** (free; US federal jobs), **Adzuna API** (free tier; job listings), **or an open jobs dataset.** Honest test for each: free? does it return the fields you match on (values, role, location)? does it fit your app?

### Part 4 — A note for the API groups

An **API** is just a way for one app to ask another app for data. (Example: your app asks Spotify "what genre is this artist?" and Spotify sends back the answer.) Before you wire one in, check three things:

1. **Is it free?**
2. **Does it return what you actually need** — the exact facts you match on?
3. **Is it worth the extra step** for your demo?

If any answer is *no*, skip it. A great app doesn't need an API — this template matches people perfectly well with no outside data at all. Add one only when it clearly makes your app better.

---

## Make it yours

Do these in order. Each step teaches one idea while you change it, and ends with **how to check it worked**. Update the **PROGRESS** line at the top when you finish one.

### Step 1 — Identity + design

**The idea:** every color, font, and the app's feel live in ONE file: `public/theme.css`. You change values there and the whole app updates. You never hunt through pages.

**Do this:** open `public/theme.css` and change these:

```css
--accent:  #ff5a4d;   /* your main "do this" color: buttons, links */
--bg:      #faf6ef;   /* page background */
--ink:     #1c1b1a;   /* main text color */
```

**What colors do, and how to pick:**
- A hex code like `#ff5a4d` is just Red-Green-Blue in base-16. You don't need to memorize it — grab colors from a picker like [coolors.co](https://coolors.co).
- Pick **one** accent color and use it only for actions (buttons, links). That's what makes an interface feel intentional instead of noisy.
- **Contrast matters:** dark text on a light background, or light on dark. If you have to squint, it's wrong.
- Rename the app: change the name in `public/index.html` (the `.brand-name` in the top bar and the `<title>`), and `name`/`short_name` in `public/manifest.json`.

**Check it worked:** run `npm run dev`, open the app. Your button color changed everywhere. If it didn't, you edited the wrong variable — the names are commented in `theme.css`.

---

### Step 2 — The questions

**The idea:** the survey is one list in `public/questions.js`. The sign-up flow shows those questions **one screen at a time** (with a progress bar and Back/Next), and the matcher compares answers automatically. Change the list → the whole app follows. There are **three kinds** of question, and one of each is already in the file:

1. **Simple** — pick one (`type: "select"`) or type text (`type: "text"`).
2. **Branching** — one answer reveals a follow-up. Look at the `mode` question: picking "In person" asks *where*; picking "Online" asks *which platform*. That's the `branch` block — `{ "In person": [ ...follow-up... ], "Online": [ ... ] }`.
3. **Multi-select** — pick several (`type: "multi"`). The answer becomes a **list**, and the matcher gives a point for every item two people share. (Want a *ranked* question instead? A multi-select where order matters is the same idea — store the picks as a list; the first is the top choice.)

**Do this:** add a new simple question to the list:

```js
{
  id: "snack",
  type: "select",
  label: "Best study snack?",
  options: ["Coffee", "Tea", "Fruit", "Chips"],
},
```

**Check it worked:** `npm run dev`, reload sign-up. Your new question appears. Sign up two people who both pick "Coffee" and their match reason will include "Coffee" — because the matcher compares answers with no extra work from you.

> **Heads-up:** the age field lives in `app.js` (the profile step of the sign-up flow), not `questions.js`, because it powers a safety rule. More on that next.

---

### Step 3 — The match (the important one)

Open `functions/api/match.js`. It's built in **two clearly labeled layers**. Read the big comment banners at the top.

**Layer 1 — the RULES (the safety net).** Plain code. No AI, no key. It does four things:
- **Hard rules** ("never match if…") — these ALWAYS win over any score. The file ships three copyable examples:
  - an **age gate** (`MIN_AGE = 16` — nobody under 16 gets matched),
  - an **age-gap** limit (`MAX_AGE_GAP = 10` — never pair people more than 10 years apart),
  - an **opposing-values block** (never pair a "Casual" learner with an "Intense" one).
  Your real app will need blocks like these — think allergy blocks, age gaps, opposing-values blocks. Edit the numbers, or add your own rule to the `HARD_RULES` list.
- **Score** — how much two people's answers overlap (+2 for an exact match, +1 per shared multi-select item).
- **Rank** — sort everyone who passed the rules, best first.
- **One match per person** — once you're matched, you're taken; nobody double-books you.

**Layer 2 — the AI (the judgment).** Optional. It sends the people who *already passed the rules* to Claude and asks for the best pick plus a warm, plain-language reason. **The AI can never break a safety rule** — it only chooses among people the rules already cleared. If there's no key (or the AI hiccups), the app silently uses the rule pick. That's why the app works perfectly with **no key at all**.

**Do this (change what it matches on):** in `ruleScore()`, an exact answer match is worth `+2`. Say you want *same subject* to matter most. Add a bonus:

```js
if (key === "subject" && a === b) score += 5;   // same subject = big deal
```

**Check it worked:** sign up two people with the same subject and two with different subjects. The same-subject pair scores higher (you'll see the number in the organizer view).

**Turn the AI on (optional):**
1. Get a key from https://console.anthropic.com (Settings → API Keys).
2. Store it as a **secret** (never put it in the code or in `wrangler.jsonc`):
   ```bash
   npx wrangler pages secret put ANTHROPIC_API_KEY
   ```
   Paste the key when asked. It's encrypted and only your functions can read it.
3. Re-deploy: `npm run deploy`.

Now matches say **"Chosen by AI"** and the reasons get warmer. Remove the key and it goes back to **"Chosen by rules"** — same app, no errors.

**What it costs:** the app uses `claude-haiku-4-5` — the fast, cheap model. A single match sends a few hundred words and gets back one sentence, so each AI match costs about **a tenth of a cent**. Matching a whole class of 30 people is **a few cents**. (Prices: about $1 per million words in, $5 per million out.)

---

### Step 4 — The conversation

**The idea:** matched people send a first message; it's stored and shown as a thread. Sending the first message flips the match **status** from `matched` to `confirmed` — that's how the status label on the result screen changes.

- Read/send lives in `functions/api/messages.js`.
- The chat screen lives in `public/app.js` (the `showChat` / `buildChatShell` section).

**Do this:** in `app.js` (find `buildChatShell`, near `chat-input`), change the placeholder text of the message box from `"Say hi…"` to your own prompt, e.g. `"Suggest a time to meet…"`.

**Check it worked:** match two people, open the chat, send a message. It appears in the thread, and the result screen now shows **Confirmed**.

---

### Step 5 — The optional API (a demonstrated door)

**The idea:** a function can pull live data from the internet. `functions/api/fun-fact.js` calls a **free, no-key** public API and returns a random fun fact — the kind of thing you'd use as an icebreaker between matched people.

It's **not** wired into the core flow on purpose. It's a door, not a wall: open `/api/fun-fact` in your browser to see it, and swap the URL for any free API (weather, quotes, holidays) when you want one.

**When you'd use this:** any time your app needs something from an outside service. Note the `try/catch` — if the outside service is down, we return a fallback instead of letting the app break. Always do that.

**Check it worked:** visit `https://YOUR-APP.pages.dev/api/fun-fact` — you get a fact. Refresh — a different one.

---

### Step 6 — Deploy it live

This is the exact, tested pipeline. Run it from the project folder.

```bash
# 1. Make your own database (once). Copy the database_id it prints.
npx wrangler d1 create studybuddy-db

# 2. Paste that database_id into wrangler.jsonc (the d1_databases -> database_id field).

# 3. Create the tables in your database (once).
npx wrangler d1 execute studybuddy-db --remote --file schema.sql

# 4. Create your Pages project (once). Pick a unique name.
npx wrangler pages project create YOUR-APP-NAME --production-branch main

# 5. Publish. Run this every time you want to push changes live.
npx wrangler pages deploy
```

The first time, run `npx wrangler login` to connect your Cloudflare account. Your app goes live at `https://YOUR-APP-NAME.pages.dev`.

**Check it worked:** open your `.pages.dev` link, sign up, and visit `/organizer` — you should see yourself in the pool.

> **Gotcha:** the database and the deploy are **separate**. If you deploy but skip steps 1–3, the pages load but anything touching data errors. Run the database steps first.

---

### Step 7 — Make it a PWA on your phone

"PWA" = a website that installs like an app. It's already set up (`manifest.json` + `sw.js` + icons). To install:

- **iPhone (Safari):** open your `.pages.dev` link → Share → **Add to Home Screen**.
- **Android (Chrome):** open the link → menu (⋮) → **Install app** / **Add to Home screen**.

You get an icon on your home screen and the app opens full-screen.

**Change the icon:** replace `public/icon.svg`, `icon-192.png`, and `icon-512.png` with your own (keep the same names and sizes), then re-deploy.

**Check it worked:** install it, turn on airplane mode, open it — the app shell still loads (the service worker cached it).

---

## Handy commands

```bash
npm run dev        # run locally at http://localhost:8788
npm run deploy     # publish live
npm run db:init    # create tables (first time)
npm run db:reset   # ⚠️ wipe all people/matches/messages (fresh start for a demo)
npm run set-key    # add your Anthropic API key as a secret (turns AI on)
```

## A couple of honest notes

- The **organizer page is open to anyone** who knows the link. Fine for a class demo; before real use, put it behind a login.
- This uses **no passwords** — it remembers you on one device only. That's on purpose to keep the example small. Real apps need real sign-in.
