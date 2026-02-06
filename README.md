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

## V1 Definition Of Done

`tickets/ROADMAP.md` is the source of truth. For V1, we explicitly target:

- Content routes ship `0` bytes of JavaScript by default (both SSR output and built HTML).
- Search index size `<= 5 MB` for `<= 2,000` pages.
- Build completes in `<= 60s` for `<= 2,000` pages on a typical laptop.

## URL Policy

- HTML pages are canonicalized to trailing-slash paths (example: `/about/`), except `/`.
- File-like paths (example: `/styles.css`, `/robots.txt`, `/index/content.md`) are not forced to trailing slash.
