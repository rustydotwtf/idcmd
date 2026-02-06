const MARKDOWN_OPTIONS = {
  autolinks: true,
  hardSoftBreaks: true,
  headings: true,
  latexMath: true,
  strikethrough: true,
  tables: true,
  tasklists: true,
  underline: true,
  wikiLinks: true,
} satisfies Bun.markdown.Options;

export const renderMarkdownToHtml = (markdown: string): string =>
  Bun.markdown.html(markdown, MARKDOWN_OPTIONS);
