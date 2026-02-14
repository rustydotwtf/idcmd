# **IDCMD_SITE_NAME**

Everything you edit lives in `site/`.

This starter is intentionally opinionated for AI-friendly markdown sites.

## Quickstart

```bash
bun install
bun run dev
```

## CI Smoke

```bash
bun run check
bun run smoke
```

## Layout

- Content: `site/content/` markdown pages (`index.md` -> `/`, `about.md` -> `/about/`)
- Code: `site/code/ui/` (`layout.tsx`, `right-rail.tsx`, `search-page.tsx`)
- Code: `site/code/runtime/` browser runtime TS (`*_idcmd` scripts compile from here)
- Code: `site/code/routes/` file-based server routes (dev/server-host only)
- Assets: `site/assets/` static files you own (icons, images, favicon, etc.)
- Styles source: `site/styles/tailwind.css`
- Config: `site/site.jsonc`
- Generated output: `dist/` (`dist/styles.css`, `dist/_idcmd/*.js`, built pages)

The mental model is simple: edit `site/content` and `site/code`, treat `dist/` as generated output.

## Sync Local Client Files

```bash
idcmd client add all
idcmd client update all --dry-run
idcmd client update layout --yes
idcmd client update runtime --yes
```

These commands copy the latest baseline implementations from `idcmd` into `site/code/ui/` and `site/code/runtime/`.
Runtime files in `site/code/runtime/` are compiled automatically by `idcmd dev` and `idcmd build`.

## Deploy (Vercel static)

```bash
bun run build
```

This produces a static `dist/` directory for Vercel.
