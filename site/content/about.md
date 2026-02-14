---
title: About
icon: info
group: main
order: 2
---

# About idcmd

idcmd is a markdown-powered docs site for people who don't care about markdown.
More accurately: it’s a small, deterministic system that’s easy for a human to use and easy for an AI agent to maintain.

---

## Philosophy: constraints are the product

Most static site generators win by giving you escape hatches.
idcmd wins by removing them.

- Plain markdown in
- Preact SSR renders the shell (sidebar, right rail, search UI)
- Plain HTML out
- One CSS file for the entire visual language
- Optional JS only when explicitly enabled and scoped

When the rules are simple, agents can keep the system healthy.

---

## The split (Markdown vs Preact)

Markdown is the content model. Preact is the view engine.

This is intentionally not MDX. When you need richer blocks, you use constrained _doc components_ in Markdown (standalone lines like `<InstallTabs pkg="zod" />`).

- HTML pages render components via SSR (no hydration by default)
- `/<slug>.md` expands components to plain markdown so agents never see JSX/MDX

---

## Infra as content

Treat your docs like infrastructure:

- inputs are versioned
- outputs are predictable
- changes are verified

Today, that “contract” is mostly enforced by:

- URL invariants
- JS policy
- tests and `bun run check`

Next (planned): content contracts (Zod), dead-link checks, and stricter shape validation so agents can’t accidentally drift the site.

---

## What idcmd is not

- Not an MDX playground
- Not a component framework
- Not a client-side app disguised as docs

It’s a fast publishing pipeline for content.
