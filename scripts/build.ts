import { renderLayout } from "../src/Layout.tsx";
import { Glob } from "bun";
import { createHighlighter, type Highlighter } from "shiki";

// Find all content.md files in content/<slug>/ directories
const glob = new Glob("*/content.md");
const contentFiles: string[] = [];

for await (const file of glob.scan("content")) {
  contentFiles.push(`content/${file}`);
}

console.log(`Found ${contentFiles.length} content pages`);

// Extract title from markdown (first h1)
function extractTitle(markdown: string): string | undefined {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1];
}

// Initialize shiki highlighter
const highlighter: Highlighter = await createHighlighter({
  themes: ["github-dark", "github-light"],
  langs: [
    "javascript",
    "typescript",
    "jsx",
    "tsx",
    "json",
    "html",
    "css",
    "markdown",
    "bash",
    "shell",
    "python",
    "rust",
    "go",
    "sql",
    "yaml",
    "toml",
  ],
});

// Highlight code blocks in HTML using shiki
function highlightCodeBlocks(html: string): string {
  const codeBlockRegex =
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;

  const matches = [...html.matchAll(codeBlockRegex)];

  let result = html;
  for (const match of matches) {
    const fullMatch = match[0];
    const lang = match[1] ?? "plaintext";
    const encodedCode = match[2] ?? "";

    const code = encodedCode
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const loadedLangs = highlighter.getLoadedLanguages();
    const effectiveLang = loadedLangs.includes(lang) ? lang : "plaintext";

    const highlighted = highlighter.codeToHtml(code, {
      lang: effectiveLang as string,
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    });

    result = result.replace(fullMatch, highlighted);
  }

  return result;
}

// Ensure dist directory exists
await Bun.write("dist/.gitkeep", "");

for (const file of contentFiles) {
  const markdown = await Bun.file(file).text();
  const title = extractTitle(markdown);

  // Convert markdown to HTML and apply syntax highlighting
  let contentHtml = Bun.markdown.html(markdown, {
    tables: true,
    strikethrough: true,
    tasklists: true,
    hardSoftBreaks: true,
    wikiLinks: true,
    underline: true,
    latexMath: true,
    headings: true,
    autolinks: true,
  });
  contentHtml = highlightCodeBlocks(contentHtml);

  // Determine output path and current path for navigation
  // content/index/content.md -> dist/index.html, path: /
  // content/about/content.md -> dist/about/index.html, path: /about
  const slug = file.replace("content/", "").replace("/content.md", "");
  const currentPath = slug === "index" ? "/" : `/${slug}`;

  const html = renderLayout({
    title,
    content: contentHtml,
    cssPath: "/styles.css",
    currentPath,
  });

  let outPath: string;
  if (slug === "index") {
    outPath = "dist/index.html";
  } else if (slug === "404") {
    outPath = "dist/404.html";
  } else {
    outPath = `dist/${slug}/index.html`;
  }

  await Bun.write(outPath, html);
  console.log(`  ${file} -> ${outPath}`);
}

// Copy CSS to dist
const cssSource = await Bun.file("dist/styles.css").exists()
  ? "dist/styles.css"
  : "public/styles.css";

if (await Bun.file(cssSource).exists()) {
  console.log(`CSS already at dist/styles.css`);
} else {
  console.log("Warning: No styles.css found. Run build:css first.");
}

console.log("\nBuild complete!");
