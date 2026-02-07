---
title: Home
icon: home
group: main
order: 1
---

# idcmd: the markdown builder for people who don't care about markdown.

idcmd is a dead simple site builder. You drop in markdown, get a fast site, and move on with your day. If you're looking for a templating system, a component library, or a reason to obsess over markdown syntax, this isn't it.

---

## What this is

This is a static site generator with a single constraint: **every page is a markdown file styled by one CSS file**. No React components in your content. No MDX. No client-side JavaScript on content pages. It's a tool for people who just want their docs online, fast.

The entire visual language — typography, spacing, color, layout — lives in `styles.css` and is applied through Tailwind's utility classes and a hand-tuned `.prose` scope.

## How it works

1. You write markdown files in the `content/` directory
2. Bun's built-in markdown parser converts them to HTML
3. Preact SSR wraps each page in a layout with sidebar navigation
4. Tailwind compiles the stylesheet with your theme tokens
5. Shiki highlights code blocks at build time — zero runtime cost

The result is a fully static site with sub-millisecond renders and deploys that finish in **11 seconds on Vercel**.

## The stack

| Layer     | Technology      | Why                                             |
| --------- | --------------- | ----------------------------------------------- |
| Runtime   | Bun             | Fast startup, native markdown, built-in bundler |
| Rendering | Preact SSR      | Lightweight server-side HTML generation         |
| Styling   | Tailwind CSS v4 | Utility-first, single file, zero JS             |
| Syntax    | Shiki           | Build-time highlighting, dual light/dark themes |
| Body font | Inter           | Clean sans-serif for readable prose             |
| Code font | JetBrains Mono  | Ligatures, distinct characters, monospace       |

## Typography

Inline code like `bun run dev` gets soft rounded badges. Code blocks get sharp corners for a terminal feel:

```typescript
const site = await buildSite({
  content: "content/",
  styles: "styles.css",
  output: "dist/",
});
```

## Features

- File-based routing — `content/about/content.md` becomes `/about/`
- Automatic sidebar navigation from frontmatter
- Scrollspy table of contents in the right rail
- Full-text search with zero external dependencies
- LLM-ready with `llms.txt` and per-page markdown exports
- Shiki syntax highlighting for 16+ languages
- Dark mode by default, light mode supported
- Sub-millisecond server-side renders

## Why idcmd

- **11-second Vercel deploys** that keep the feedback loop tight
- **Dead simple** workflow: drop markdown in, get a site out
- **No markdown worship**: it's just the input format, not the brand
- **CLI coming soon**: the ergonomics get even better when the binary lands

## See it in action

Explore the stress tests to see how the prose styles handle real-world markdown:

- [Basic Markdown Features](/test-basics/) — Headers, lists, blockquotes, formatting
- [Code Blocks](/test-code/) — All supported Shiki languages
- [Tables](/test-tables/) — Alignments, edge cases, dense data
- [Edge Cases](/test-edge-cases/) — Unicode, emoji, HTML, unusual scenarios
- [Performance Test](/test-performance/) — 500+ lines of content
