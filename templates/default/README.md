# **IDCMD_SITE_NAME**

Everything you edit lives in `site/`.

This starter is intentionally opinionated for AI-friendly markdown sites.

## Quickstart

```bash
bun install
bun run dev
```

## Layout

- `site/content/` markdown pages (`index.md` -> `/`, `about.md` -> `/about/`)
- `site/client/` local UI implementation (`layout.tsx`, `right-rail.tsx`, `search-page.tsx`)
- `site/client/runtime/` local browser runtime TS (`*_idcmd` scripts compile from here)
- `site/styles/tailwind.css` Tailwind entrypoint (compiled to `site/public/styles.css`)
- `site/public/` static assets
- `site/server/routes/` file-based server routes (dev/server-host only)
- `site/site.jsonc` site configuration

## Sync Local Client Files

```bash
idcmd client add all
idcmd client update all --dry-run
idcmd client update layout --yes
idcmd client update runtime --yes
```

These commands copy the latest baseline implementations from `idcmd` into `site/client/`.
Runtime files in `site/client/runtime/` are compiled automatically by `idcmd dev` and `idcmd build`.

## Deploy (Vercel static)

```bash
bun run build
```

This produces a static `dist/` directory for Vercel.
