# The Majlis — Project tracker (POC)

Visual prototype for an interior design project tracker, themed to match the aesthetic of themajlis.es.

## Stack

- Vite + Vue 3 (composition API, `<script setup>`)
- Vanilla CSS, no framework
- Mock data baked into `src/data.js` — no backend yet

## Run locally

```bash
npm install
npm run dev
```

The app opens automatically at http://localhost:5173

## What's in here

**Projects view** — filterable, searchable, sortable table of projects. Status chips, stats cards across the top.

**New project form** — three-section intake:
1. Client (pick existing via searchable dropdown, or create new inline)
2. Project details (name, location, stage, budget+currency, communication language)
3. Timeline & notes

When you pick an existing client, the form auto-fills the communication language from the client's preferred language. Saving logs the payload to the console for now — wire up to your API when ready.

## Project structure

```
src/
├── App.vue                    Root layout, header, view switching
├── main.js                    Entry point
├── styles.css                 Global theme tokens and base styles
├── data.js                    Mock clients, projects, dropdowns
└── components/
    ├── ProjectsView.vue       Projects table
    └── ProjectFormView.vue    New project intake form
```

## Theme tokens

All design tokens live as CSS variables in `src/styles.css`. Swap them once, the whole app reskins.

- `--m-cream` / `--m-paper` — warm cream backgrounds (page and surfaces)
- `--m-ink` / `--m-ink-2` / `--m-ink-3` — text hierarchy in warm browns rather than pure black
- `--m-brass` — accent for focused inputs, active nav, section eyebrows
- `--m-line` / `--m-line-soft` — hairline borders at two opacity levels
- Status colors: `--m-status-{new|sales|ongoing|snag}-{bg|fg}` for the chips
- Type: `--font-display` (Cormorant Garamond) for headings, `--font-sans` (DM Sans) for body

## Next steps for a real backend

1. Replace `src/data.js` with API calls (axios or fetch) to your FastAPI endpoints
2. Add Vue Router for proper deep-linking to project detail pages
3. Auth (your team has done this before with FastAPI)
4. Project detail page, client detail page
5. Decide whether "Snag list" is a top-level status or a sub-resource on a project (see the architecture notes from the earlier conversation)
