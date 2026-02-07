---
title: Use With AI
icon: code
group: main
order: 3
---

# Use idcmd with an AI agent

This project is designed to be steered by a human and executed by an agent.

---

## What you tell the agent

- Add or modify pages under `content/<slug>/content.md`
- Use YAML frontmatter: `title`, `group`, `order`, `icon`
- Keep content pages free of client-side JS
- Prefer internal links with canonical trailing slashes (example: `/about/`)

---

## What the agent should run

- `bun run check` (must be green)

If it’s not green, the agent keeps going until it is.

---

## Suggested “task list” prompt

Copy/paste prompt:

> You’re my idcmd maintainer. Add or update pages in `content/<slug>/content.md`. Use YAML frontmatter for `title`, `group`, `order`, and `icon`. Do not add client-side JS to content pages. After changes, run `bun run check` and fix failures until it’s green.

Task list pattern:

> You are my idcmd maintainer. Do the tasks below in order. After each task, run `bun run check`. If anything fails, fix it before continuing. Tasks:
>
> 1. ...
> 2. ...
> 3. ...

---

## What not to do

- Don’t add MDX.
- Don’t put components in markdown content.
- Don’t add client-side JS to content pages (search and scrollspy are the only scoped exceptions).

---

## Future: contracts (planned)

The direction is to add strict content contracts so agents can validate:

- no dead internal links
- frontmatter conforms to schema (Zod)
- no missing icons / unknown nav groups
