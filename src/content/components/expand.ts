import type { DocComponentContext } from "./types";

import { getDocComponent } from "./registry";

type ExpandTarget = "html" | "markdown";

interface SplitFrontmatterResult {
  content: string;
  prefix: string;
}

const FRONTMATTER_BLOCK_REGEX = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

const tryExtractFrontmatterBlock = (
  markdown: string,
  startIndex: number
): string | null => {
  const slice = markdown.slice(startIndex);
  if (!slice.startsWith("---")) {
    return null;
  }

  const match = slice.match(FRONTMATTER_BLOCK_REGEX);
  const [block] = match ?? [];
  return block ?? null;
};

const splitFrontmatterPreserveRaw = (
  markdown: string
): SplitFrontmatterResult => {
  const startIndex = markdown.search(/\S/);
  const block =
    startIndex === -1 ? null : tryExtractFrontmatterBlock(markdown, startIndex);

  if (!block || startIndex === -1) {
    return { content: markdown, prefix: "" };
  }

  const prefix = markdown.slice(0, startIndex) + block;
  return { content: markdown.slice(prefix.length), prefix };
};

const getNewline = (value: string): "\n" | "\r\n" =>
  value.includes("\r\n") ? "\r\n" : "\n";

interface ParsedTag {
  attrs: Record<string, boolean | string>;
  name: string;
  rawLine: string;
}

const isStandaloneComponentLine = (line: string): boolean =>
  /^\s*<[A-Z][A-Za-z0-9]*\b[^>]*\/>\s*$/.test(line);

const containsDisallowedJsTokens = (value: string): boolean =>
  value.includes("{") || value.includes("}");

const ATTRIBUTE_REGEX = /\s*([A-Za-z][A-Za-z0-9_-]*)(?:="([^"]*)")?/y;

const readNextAttribute = (
  raw: string,
  index: number
): { key: string; nextIndex: number; value: boolean | string } => {
  ATTRIBUTE_REGEX.lastIndex = index;
  const match = ATTRIBUTE_REGEX.exec(raw);
  if (!match) {
    throw new Error("Invalid attribute syntax");
  }

  const [, key, value] = match;
  return {
    key: key ?? "",
    nextIndex: ATTRIBUTE_REGEX.lastIndex,
    value: value ?? true,
  };
};

const parseAttributesFromTrimmed = (
  trimmed: string
): Record<string, boolean | string> => {
  const attrs: Record<string, boolean | string> = {};
  let index = 0;

  while (index < trimmed.length) {
    const parsed = readNextAttribute(trimmed, index);
    attrs[parsed.key] = parsed.value;
    index = parsed.nextIndex;
  }

  return attrs;
};

const parseAttributes = (raw: string): Record<string, boolean | string> => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {};
  }

  if (containsDisallowedJsTokens(trimmed)) {
    throw new Error("JS expressions are not allowed in doc components");
  }

  return parseAttributesFromTrimmed(trimmed);
};

const parseStandaloneTagLine = (line: string): ParsedTag => {
  if (containsDisallowedJsTokens(line)) {
    throw new Error("JS expressions are not allowed in doc components");
  }

  const match = line.match(/^\s*<([A-Z][A-Za-z0-9]*)\b([^>]*)\/>\s*$/);
  if (!match) {
    throw new Error("Invalid component tag");
  }

  const name = match[1] ?? "";
  const rawAttrs = match[2] ?? "";
  const attrs = parseAttributes(rawAttrs);

  return { attrs, name, rawLine: line };
};

const renderErrorHtml = (message: string): string =>
  [
    '<div class="doc-component-error" role="alert">',
    "<strong>Doc component error:</strong> ",
    message.replaceAll("&", "&amp;").replaceAll("<", "&lt;"),
    "</div>",
  ].join("");

const renderErrorMarkdown = (message: string): string =>
  ["> Doc component error:", `> ${message.replaceAll("\n", " ")}`, ""].join(
    "\n"
  );

const formatComponentError = (options: {
  lineNumber: number;
  message: string;
  slug: string;
}): string =>
  `[${options.slug}] line ${options.lineNumber}: ${options.message}`;

const isFenceToggleLine = (line: string): boolean => /^\s*```/.test(line);

const createInstanceContext = (
  ctx: DocComponentContext,
  lineNumber: number
): DocComponentContext => ({ ...ctx, instanceId: `${ctx.slug}:${lineNumber}` });

const renderComponentTarget = (options: {
  ctx: DocComponentContext;
  line: string;
  lineNumber: number;
  target: ExpandTarget;
}): string | Promise<string> => {
  const parsed = parseStandaloneTagLine(options.line);
  const component = getDocComponent(parsed.name);
  if (!component) {
    return options.line;
  }

  const validated = component.schema.parse(parsed.attrs);
  const instanceCtx = createInstanceContext(options.ctx, options.lineNumber);

  return options.target === "html"
    ? component.renderHtml(validated, instanceCtx)
    : component.renderMarkdown(validated, instanceCtx);
};

const throwNonDevExpansionError = (options: {
  ctx: DocComponentContext;
  lineNumber: number;
  originalError: unknown;
}): never => {
  const message =
    options.originalError instanceof Error
      ? options.originalError.message
      : "Unknown component error";

  throw new Error(
    formatComponentError({
      lineNumber: options.lineNumber,
      message,
      slug: options.ctx.slug,
    }),
    { cause: options.originalError }
  );
};

const shouldSkipExpansion = (inFence: boolean, line: string): boolean =>
  inFence || !isStandaloneComponentLine(line);

const tryToggleFence = (
  line: string,
  inFence: boolean
): { inFence: boolean; output: string } | null =>
  isFenceToggleLine(line) ? { inFence: !inFence, output: line } : null;

const handleExpansionError = (options: {
  ctx: DocComponentContext;
  error: unknown;
  lineNumber: number;
  target: ExpandTarget;
}): string => {
  const message =
    options.error instanceof Error
      ? options.error.message
      : "Unknown component error";
  const formatted = formatComponentError({
    lineNumber: options.lineNumber,
    message,
    slug: options.ctx.slug,
  });

  return options.target === "html"
    ? renderErrorHtml(formatted)
    : renderErrorMarkdown(formatted);
};

const expandComponentLineOrError = async (options: {
  ctx: DocComponentContext;
  inFence: boolean;
  line: string;
  lineNumber: number;
  target: ExpandTarget;
}): Promise<{ inFence: boolean; output: string }> => {
  try {
    const output = await renderComponentTarget({
      ctx: options.ctx,
      line: options.line,
      lineNumber: options.lineNumber,
      target: options.target,
    });
    return { inFence: options.inFence, output };
  } catch (error) {
    if (!options.ctx.isDev) {
      throwNonDevExpansionError({
        ctx: options.ctx,
        lineNumber: options.lineNumber,
        originalError: error,
      });
    }

    return {
      inFence: options.inFence,
      output: handleExpansionError({
        ctx: options.ctx,
        error,
        lineNumber: options.lineNumber,
        target: options.target,
      }),
    };
  }
};

const expandLine = (options: {
  ctx: DocComponentContext;
  inFence: boolean;
  line: string;
  lineNumber: number;
  target: ExpandTarget;
}): Promise<{ inFence: boolean; output: string }> => {
  const toggled = tryToggleFence(options.line, options.inFence);
  if (toggled) {
    return Promise.resolve(toggled);
  }

  if (shouldSkipExpansion(options.inFence, options.line)) {
    return Promise.resolve({ inFence: options.inFence, output: options.line });
  }

  return expandComponentLineOrError(options);
};

const splitLines = (
  content: string
): { lines: string[]; newline: "\n" | "\r\n" } => ({
  lines: content.split(/\r?\n/),
  newline: getNewline(content),
});

const countNewlines = (value: string): number => {
  const matches = value.match(/\r?\n/g);
  return matches ? matches.length : 0;
};

const expandContent = async (
  content: string,
  ctx: DocComponentContext,
  lineOffset: number,
  target: ExpandTarget
): Promise<string> => {
  const { lines, newline } = splitLines(content);

  const out: string[] = [];
  let inFence = false;
  let localLineNumber = 0;

  for (const line of lines) {
    localLineNumber += 1;
    const expanded = await expandLine({
      ctx,
      inFence,
      line,
      lineNumber: lineOffset + localLineNumber,
      target,
    });
    ({ inFence } = expanded);
    out.push(expanded.output);
  }

  return out.join(newline);
};

export const expandMarkdownForHtml = async (
  markdown: string,
  ctx: DocComponentContext
): Promise<string> => {
  const { content, prefix } = splitFrontmatterPreserveRaw(markdown);
  const expanded = await expandContent(
    content,
    ctx,
    countNewlines(prefix),
    "html"
  );
  return `${prefix}${expanded}`;
};

export const expandMarkdownForAgent = async (
  markdown: string,
  ctx: DocComponentContext
): Promise<string> => {
  const { content, prefix } = splitFrontmatterPreserveRaw(markdown);
  const expanded = await expandContent(
    content,
    ctx,
    countNewlines(prefix),
    "markdown"
  );
  return `${prefix}${expanded}`;
};

export const expandMarkdownContentForHtml = (
  content: string,
  ctx: DocComponentContext
): Promise<string> => expandContent(content, ctx, 0, "html");

export const expandMarkdownContentForAgent = (
  content: string,
  ctx: DocComponentContext
): Promise<string> => expandContent(content, ctx, 0, "markdown");
