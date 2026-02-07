# Markdown Site (Bun + SSR)

## Quickstart

Install dependencies:

```bash
bun install
```

Run the dev server:

```bash
bun run dev
```

Build a production `dist/`:

```bash
bun run build
```

Preview the static output:

```bash
bun run preview
```

## Example: add a page

Create:

`content/hello/content.md`

```md
---
title: Hello
group: main
order: 99
icon: file
---

# Hello

This is a new page.
```

Now it exists at:

- `/hello/`

## Customize the UI (Preact SSR)

Markdown is the content model. Preact SSR is the view engine.

- Edit `src/render/layout.tsx` to change the shell.
- Edit `src/render/right-rail.tsx` for the LLM menu / TOC panel.
- Edit `src/search/page.tsx` for the search UI.

## V1 Definition Of Done

`tickets/ROADMAP.md` is the source of truth. For V1, we explicitly target:

- Content routes ship `0` bytes of JavaScript by default (both SSR output and built HTML).
- Search index size `<= 5 MB` for `<= 2,000` pages.
- Build completes in `<= 60s` for `<= 2,000` pages on a typical laptop.

## URL Policy

- HTML pages are canonicalized to trailing-slash paths (example: `/about/`), except `/`.
- File-like paths (example: `/styles.css`, `/robots.txt`, `/index/content.md`) are not forced to trailing slash.

## Invariants

### Slug and path rules

- Content lives at `content/<slug>/content.md`.
- `slug="index"` is the home page.
- Canonical HTML paths are `/` for index and `/<slug>/` otherwise.
- Markdown download paths exist in two forms:
  - Flat: `/index.md` and `/<slug>.md`
  - Nested: `/index/content.md` and `/<slug>/content.md`

### baseUrl vs origin

- `site.baseUrl` is normalized to an origin (protocol + host + optional port). Any path/query/hash in config is stripped.
- Dev server canonicals always use the request `origin` (localhost should not emit production canonicals).
- Non-dev/server canonicals prefer `site.baseUrl` and fall back to request `origin`.

### JS policy

- Content routes ship `0` bytes of JavaScript by default.
- Allowed scripts:
  - Dev only: `/live-reload.js`
  - Optional: `/right-rail-scrollspy.js` only when scrollspy is enabled and the computed TOC is non-empty
- Search page is SSR-only by default (no client JS).
