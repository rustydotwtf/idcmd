# idcmd (Markdown Site CLI, Bun + SSR)

## Create A Site

```bash
bunx idcmd@latest init my-docs
cd my-docs
bun install
bun run dev
```

Everything you edit lives in `site/`.

## CLI

```bash
idcmd init [dir]   # scaffold a new site
idcmd dev          # tailwind watch + SSR dev server
idcmd build        # static dist/
idcmd preview      # serve dist/ locally
idcmd deploy       # build + validate Vercel static deploy config
idcmd client ...   # add/update local site/client implementations
```

## Layout (V1)

- `site/content/<slug>.md` -> `/<slug>/` (`index.md` -> `/`)
- `site/client/*` is local source code (you own and edit these files)
- `site/styles/tailwind.css` -> `site/public/styles.css` (dev) / `dist/styles.css` (build)
- `site/public/` static assets
- `site/server/routes/**` file-based server routes (dev/server-host only)
- `site/site.jsonc` site config

## Syncing Local Client Code

Use these commands to pull baseline UI implementations into your project:

```bash
idcmd client add all
idcmd client update all --dry-run
idcmd client update layout --yes
```

`add` creates missing files. `update` overwrites changed files and requires `--yes` unless `--dry-run` is used.

## Example: Add A Page

Create `site/content/hello.md`:

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

It renders at `/hello/`.

## Custom Server Routes (V1)

Add `site/server/routes/api/hello.ts`:

```ts
export const GET = (): Response => Response.json({ ok: true });
```

It responds at `/api/hello`.

## V1 Definition Of Done

`tickets/ROADMAP.md` is the source of truth. For V1, we explicitly target:

- Content routes ship `0` bytes of JavaScript by default (both SSR output and built HTML).
- Search index size `<= 5 MB` for `<= 2,000` pages.
- Build completes in `<= 60s` for `<= 2,000` pages on a typical laptop.

## URL Policy

- HTML pages are canonicalized to trailing-slash paths (example: `/about/`), except `/`.
- File-like paths (example: `/styles.css`, `/robots.txt`, `/index.md`) are not forced to trailing slash.

## Invariants

### Slug and path rules

- Content lives at `site/content/<slug>.md` (or legacy `content/<slug>.md`).
- `slug="index"` is the home page.
- Canonical HTML paths are `/` for index and `/<slug>/` otherwise.
- Markdown download paths exist in two forms:
  - Flat: `/index.md` and `/<slug>.md`
  - Flat: `/index.md` and `/<slug>.md`

### baseUrl vs origin

- `site.baseUrl` is normalized to an origin (protocol + host + optional port). Any path/query/hash in config is stripped.
- Dev server canonicals always use the request `origin` (localhost should not emit production canonicals).
- Non-dev/server canonicals prefer `site.baseUrl` and fall back to request `origin`.

### JS policy

- Content routes ship `0` bytes of JavaScript by default.
- Allowed scripts:
  - Dev only: `/_idcmd/live-reload.js`
  - Optional: `/_idcmd/right-rail-scrollspy.js` only when scrollspy is enabled and the computed TOC is non-empty
- Search page is SSR-only by default (no client JS).
