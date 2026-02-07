---
title: Home
icon: home
group: main
order: 1
---

# i don't care about markdown

## i care about shipping a site

idcmd is a tiny docs-site system:

- **Markdown** is the content format
- **Preact SSR** is the view engine
- **HTML** is the output
- **Zero JS on content pages** by default

---

## Quickstart

```bash
bun install
bun run dev
```

Open:

- `http://localhost:4000`

Build static output:

```bash
bun run build
```

---

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

---

## What you edit (90% of the time)

- `content/**/content.md` (pages)
- `content/styles.css` (the whole visual language)

If you want to change layout/navigation/search UI, you edit Preact SSR:

- `src/render/*`
- `src/search/*`

---

## Use it with an AI agent

The repo is designed to be maintained by an agent without drifting into chaos.

Copy/paste prompt:

> You’re my idcmd maintainer. Add or update pages in `content/<slug>/content.md`. Use YAML frontmatter for `title`, `group`, `order`, and `icon`. Do not add client-side JS to content pages. After changes, run `bun run check` and fix failures until it’s green.

---

## The constraint (aka the point)

No MDX. No components-in-content. No “framework inside your docs”.

Just markdown in folders. Preact SSR wraps it. HTML comes out. Agents can reason about that.

---

## Planned next (not shipped yet)

Deterministic content checks (fail build on):

- broken internal links/anchors
- invalid frontmatter shapes (Zod)
- unknown nav groups/icons
