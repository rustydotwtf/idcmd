---
title: About
icon: info
group: main
order: 2
---

# About idcmd

idcmd is a dead simple site builder—built for both humans and AI to use, and thoughtfully engineered so that agents can easily maintain and evolve the codebase too. Just drop in markdown, get a fast site, and move on with your day.

---

## Philosophy

Most static site generators give you too many escape hatches. MDX, custom components, client-side JavaScript — each one adds complexity and pulls you further from getting a site online.

This project takes the opposite approach: **every page is plain markdown, styled by a single CSS file.** That constraint forces good typography, intentional spacing, and a coherent visual language. If the prose styles can't make your content look great, the styles need to improve — not your content. The goal isn't markdown purity, it's speed and clarity.

> The constraint isn't a limitation. It's the whole point.

## Brand promises

- **11-second Vercel deploys** so iteration stays instant
- **Dead simple** workflow with no extra abstractions
- **Markdown as a means, not an identity**
- **CLI coming soon** to make publishing even faster

## Architecture

The stack is deliberately minimal:

- **Bun** handles the server, markdown parsing, and bundling. One runtime, no build chain.
- **Preact SSR** renders layouts server-side with zero client-side hydration on content pages.
- **Tailwind CSS v4** compiles the theme from a single `styles.css` file using `@theme inline` tokens.
- **Shiki** highlights code blocks at build time with dual light/dark themes — no runtime syntax highlighter.

### File-based routing

Drop a markdown file in `content/`, and it becomes a page:

```
content/
  index/content.md    → /
  about/content.md    → /about/
  guide/content.md    → /guide/
```

Frontmatter controls navigation order, grouping, and icons. The sidebar builds itself.

### Search

Full-text search runs entirely server-side. No Algolia, no Pagefind, no external service. The search index is built from your markdown content at startup and queried via a simple GET request.

### LLM support

Every page is available as raw markdown at `/{slug}.md`. A `/llms.txt` file provides a machine-readable site index. This makes the entire site accessible to language models without scraping.

## Design decisions

- **Inter for body, JetBrains Mono for code** — readability where it matters, developer feel in the chrome
- **Sharp code blocks, rounded inline code** — terminal windows vs. soft badges
- **Left-border indicators** — active sidebar links, TOC items, and blockquotes all share the same visual language
- **Generous whitespace** — breathing room in prose, density in navigation

## Source

This project is open source and built with the tools it documents. Every page you're reading is a markdown file in the `content/` directory.
