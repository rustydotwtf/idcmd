# idcmd (Markdown Site CLI, Bun + SSR)

## Create A Site

```bash
bunx idcmd@latest init my-docs
cd my-docs
bun install
bun run dev
```

Everything you edit lives at the project root-level source folders (`content/`, `src/`, `styles/`, `assets/`, `site.jsonc`).

## CLI

```bash
idcmd init [dir]   # scaffold a new site
idcmd dev          # tailwind watch + SSR dev server
idcmd build        # static public/
idcmd preview      # serve public/ locally
idcmd deploy       # build + generate deploy files (Vercel/Fly/Railway)
idcmd client ...   # add/update local src implementations
```

### Deploy targets

```bash
idcmd init my-docs --fly
idcmd init my-docs --railway
idcmd init my-docs --vercel

idcmd deploy --fly
idcmd deploy --railway
idcmd deploy --vercel
```

`idcmd init --yes` is provider-neutral by default (no provider files generated).

## Layout (V1)

- `content/<slug>.md` -> `/<slug>/` (`index.md` -> `/`)
- `src/ui/*` is local UI source code (you own and edit these files)
- `src/runtime/*.ts` is local browser runtime code (compiled to `public/_idcmd/*.js`)
- `src/routes/**` file-based server routes (dev/server-host only)
- `styles/tailwind.css` -> `public/styles.css`
- `assets/` static assets
- `site.jsonc` site config
- `public/` generated output (gitignored)

## Syncing Local Client Code

Use these commands to pull baseline UI implementations into your project:

```bash
idcmd client add all
idcmd client update all --dry-run
idcmd client update layout --yes
idcmd client update runtime --yes
```

`add` creates missing files. `update` overwrites changed files and requires `--yes` unless `--dry-run` is used.
Runtime files in `src/runtime/` are compiled automatically by `idcmd dev` and `idcmd build`.

## Example: Add A Page

Create `content/hello.md`:

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

Add `src/routes/api/hello.ts`:

```ts
export const GET = (): Response => Response.json({ ok: true });
```

It responds at `/api/hello`.

## V1 Definition Of Done

`tickets/ROADMAP.md` is the source of truth. For V1, we explicitly target:

- Content routes ship `0` bytes of JavaScript by default (both SSR output and built HTML).
- Content routes ship a small, opinionated JavaScript runtime by default (prefetch + optional right-rail behavior).
- Search index size `<= 5 MB` for `<= 2,000` pages.
- Build completes in `<= 60s` for `<= 2,000` pages on a typical laptop.

## URL Policy

- HTML pages are canonicalized to trailing-slash paths (example: `/about/`), except `/`.
- File-like paths (example: `/styles.css`, `/robots.txt`, `/index.md`) are not forced to trailing slash.

## Invariants

### Slug and path rules

- Content lives at `content/<slug>.md`.
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

- Content routes ship lightweight runtime scripts by default.
- Script behavior:
  - Always: `/_idcmd/nav-prefetch.js`
  - Dev only: `/_idcmd/live-reload.js`
  - Right rail enabled: `/_idcmd/llm-menu.js`
  - Right rail scrollspy enabled with non-empty TOC: `/_idcmd/right-rail-scrollspy.js`
