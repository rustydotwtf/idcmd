# **IDCMD_SITE_NAME**

Everything you edit lives in `site/`.

## Quickstart

```bash
bun install
bun run dev
```

## Layout

- `site/content/` markdown pages (`index.md` -> `/`, `about.md` -> `/about/`)
- `site/styles/tailwind.css` Tailwind entrypoint (compiled to `site/public/styles.css`)
- `site/public/` static assets
- `site/server/routes/` file-based server routes (dev/server-host only)
- `site/site.jsonc` site configuration

## Deploy (Vercel static)

```bash
bun run build
```

This produces a static `dist/` directory for Vercel.
