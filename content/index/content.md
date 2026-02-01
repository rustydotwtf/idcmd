# Welcome to Markdown Site

This is a minimal **Bun + React SSR** site that renders markdown files.

## Features

- Server-side rendering with React
- Built-in markdown parsing via `Bun.markdown.react()`
- Vercel CDN caching with `s-maxage` headers
- File-based routing from the `content/` directory

## How it works

1. Request comes in to `/about`
2. Server looks for `content/about.md`
3. Markdown is parsed and rendered with React!!!!
4. HTML is returned with cache headers

## Example code

```typescript
const content = Bun.markdown.react(markdown);
const html = renderToString(<Layout>{content}</Layout>);
```

## Links

- [About page](/about)
- [Bun documentation](https://bun.sh)
