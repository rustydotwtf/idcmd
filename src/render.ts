import { renderLayout } from "./Layout.tsx";
import { createHighlighter, type Highlighter } from "shiki";

const liveReloadScript = `
<script>
(function() {
  const ws = new WebSocket('ws://' + location.host + '/__live-reload');
  ws.onmessage = function(e) {
    if (e.data === 'reload') {
      console.log('[live-reload] Reloading...');
      location.reload();
    }
  };
  ws.onclose = function() {
    console.log('[live-reload] Disconnected, attempting reconnect...');
    setTimeout(function() { location.reload(); }, 1000);
  };
})();
</script>
`;

// Initialize shiki highlighter (cached singleton)
let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
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
  }
  return highlighterPromise;
}

// Highlight code blocks in HTML using shiki
async function highlightCodeBlocks(html: string): Promise<string> {
  const highlighter = await getHighlighter();

  // Match <pre><code class="language-xxx">...</code></pre> blocks
  const codeBlockRegex =
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;

  const matches = [...html.matchAll(codeBlockRegex)];

  let result = html;
  for (const match of matches) {
    const fullMatch = match[0];
    const lang = match[1] ?? "plaintext";
    const encodedCode = match[2] ?? "";

    // Decode HTML entities
    const code = encodedCode
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Check if language is loaded, fallback to plaintext
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

export async function render(
  markdown: string,
  title?: string,
  isDev = false,
  currentPath = "/"
): Promise<string> {
  // Convert markdown to HTML string with GFM extensions
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

  // Apply syntax highlighting to code blocks
  contentHtml = await highlightCodeBlocks(contentHtml);

  // Render with static layout
  let html = renderLayout({
    title,
    content: contentHtml,
    currentPath,
  });

  // Add live reload script for dev mode
  if (isDev) {
    html = html.replace("</body>", `${liveReloadScript}</body>`);
  }

  return html;
}
