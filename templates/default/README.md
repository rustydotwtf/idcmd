# **IDCMD_SITE_NAME**

Everything you edit lives in root-level source folders.

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

- Content: `content/` markdown pages (`index.md` -> `/`, `about.md` -> `/about/`)
- Code: `src/ui/` (`layout.tsx`, `right-rail.tsx`, `search-page.tsx`)
- Code: `src/runtime/` browser runtime TS (`*_idcmd` scripts compile from here)
- Code: `src/routes/` file-based server routes (dev/server-host only)
- Assets: `assets/` static files you own (icons, images, favicon, etc.)
- Styles source: `styles/tailwind.css`
- Config: `site.jsonc`
- Generated output: `public/` (`public/styles.css`, `public/_idcmd/*.js`, built pages)

The mental model is simple: edit `content` and `src`, treat `public/` as generated output.

## Sync Local Client Files

```bash
idcmd client add all
idcmd client update all --dry-run
idcmd client update layout --yes
idcmd client update runtime --yes
```

These commands copy the latest baseline implementations from `idcmd` into `src/ui/` and `src/runtime/`.
Runtime files in `src/runtime/` are compiled automatically by `idcmd dev` and `idcmd build`.

## Deploy

```bash
idcmd deploy --vercel
idcmd deploy --fly
idcmd deploy --railway
```

Use one provider flag at a time to generate deployment files.
