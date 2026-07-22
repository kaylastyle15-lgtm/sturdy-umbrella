

```
/
├── index.html              Home
├── collections.html        Collections hub (10 sub-collections)
├── collections-books.html
├── collections-films.html
├── collections-music.html
├── collections-photography.html   (asymmetric editorial layout, grouped by roll)
├── collections-places.html
├── collections-recipes.html
├── collections-coffee.html
├── collections-objects.html
├── collections-quotes.html        (text-only index-card layout)
├── collections-current-obsessions.html
├── journal.html            Journal hub (short thoughts / essays / life / finds)
├── journal-entry.html      Single entry — the template to duplicate
├── lookbook.html           Moodboards, color stories, interiors, fashion
├── desk.html               Now-page: reading, playlist, tabs, links
├── guestbook.html          Visitor messages (client-side demo, no backend yet)
├── archive.html            Full chronological index
├── about.html              Introduction, philosophy, contact
├── css/
│   ├── tokens.css          Color, type, spacing — change the site's mood here
│   ├── base.css            Reset + typography + page shell + grain texture
│   └── components.css      Nav spine, film-frame, cards, forms, pinboard
└── js/
    ├── components.js       <site-nav>, <site-footer>, <film-frame> web components
    └── main.js             Scroll reveal, guestbook demo, random-featured-image
```

## Design system, briefly

- **Palette**: aged paper (`--paper`), faded-ink text (`--ink`), a postal-stamp
  rust (`--rust`) and a ballpoint teal (`--teal`) as the only two accents.
- **Type**: Fraunces (display), Newsreader (body/reading), Space Mono
  (metadata/captions/labels), Caveat (handwritten annotations).
- **Signature elements**: the `<film-frame>` component (a scanned-photo /
  polaroid placeholder with an optional washi-tape corner and a handwritten
  caption) and the left-hand "spine" navigation, styled like tabbed dividers
  in a binder rather than a top navbar.

## The collections

All 10 collections now exist as real pages, each following the same
`collections-books.html` pattern with content and layout suited to what it's
actually collecting:

- `collections-books.html`, `-films.html`, `-music.html` — the standard
  entry-grid template (cover/art placeholder, title, meta row, note).
- `collections-photography.html` — breaks from the grid on purpose, grouped
  by roll in the same asymmetric editorial layout as the Lookbook, since this
  collection *is* the images rather than entries about something else.
- `collections-quotes.html` — text-only "index card" layout (torn-paper
  cards with a handwritten quote and mono source line) instead of image
  placeholders, since there's nothing to photograph.
- `collections-places.html`, `-recipes.html`, `-coffee.html`, `-objects.html`
  — the standard template with category-appropriate filters and copy.
- `collections-current-obsessions.html` — no filter row (it's six items that
  rotate monthly, not a sortable archive).

To add an 11th collection: copy whichever existing page is the closest match
in shape, swap the copy, and add a card + `href` to it in `collections.html`.

Same duplicate-and-swap pattern applies to `journal-entry.html` for new
journal entries, or wire it up to a CMS/markdown pipeline later without
touching the surrounding chrome.

## What's real vs. placeholder

- **Real**: layout, IA, navigation, type system, color system, the guestbook's
  client-side pin behavior, the homepage's random-featured-image shuffle.
- **Placeholder**: all photography (styled as scan/polaroid placeholders via
  `<film-frame>`), bios, entry copy, dates, and counts — swap in real content
  and images whenever they're ready. Replace `.film-frame__plate` with a real
  `<img>` inside `<film-frame>` (or extend the component to accept a `src`
  attribute) once photography exists.

## Adding a new top-level section

Add an entry to the `PAGES` array at the top of `js/components.js` — every
`<site-nav>` on every page updates automatically, no need to hand-edit each
page's navigation.
