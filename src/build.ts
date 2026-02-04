import { parseFrontmatter, extractTitleFromContent } from "./frontmatter";
import { renderLayout } from "./layout";
import { discoverNavigation } from "./navigation";
import { highlightCodeBlocks } from "./render";
import {
  CONTENT_DIR,
  contentGlob,
  slugFromContentFile,
} from "./utils/content-paths";
import { renderMarkdownToHtml } from "./utils/markdown";

// Find all content.md files in content/<slug>/ directories
const contentFiles: string[] = [];

for await (const file of contentGlob.scan(CONTENT_DIR)) {
  contentFiles.push(file);
}

console.log(`Found ${contentFiles.length} content pages`);

// Discover navigation once for all pages
console.log("Discovering navigation...");
const navigation = await discoverNavigation();
console.log(
  `Found ${navigation.length} groups with ${navigation.reduce((acc, g) => acc + g.items.length, 0)} total pages`
);

// Ensure dist directory exists
await Bun.write("dist/.gitkeep", "");

const resolveCssSource = async (): Promise<string | null> => {
  if (await Bun.file("dist/styles.css").exists()) {
    return "dist/styles.css";
  }
  if (await Bun.file("public/styles.css").exists()) {
    return "public/styles.css";
  }
  return null;
};

const cssSource = await resolveCssSource();
const inlineCss = cssSource ? await Bun.file(cssSource).text() : undefined;
const cssPath = inlineCss ? undefined : "/styles.css";

for (const file of contentFiles) {
  const filePath = `${CONTENT_DIR}/${file}`;
  const markdown = await Bun.file(filePath).text();

  // Parse frontmatter
  const { frontmatter, content } = parseFrontmatter(markdown);

  // Determine title: frontmatter > h1 extraction
  const title = frontmatter.title ?? extractTitleFromContent(content);

  // Convert markdown to HTML and apply syntax highlighting
  let contentHtml = renderMarkdownToHtml(content);
  contentHtml = await highlightCodeBlocks(contentHtml);

  // Determine output path and current path for navigation
  // content/index/content.md -> dist/index.html, path: /
  // content/about/content.md -> dist/about/index.html, path: /about
  const slug = slugFromContentFile(file);
  const currentPath = slug === "index" ? "/" : `/${slug}`;

  const html = renderLayout({
    content: contentHtml,
    cssPath,
    currentPath,
    inlineCss,
    navigation,
    title,
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
  console.log(`  ${filePath} -> ${outPath}`);
}

if (cssSource) {
  console.log(`Using CSS from ${cssSource}`);
} else {
  console.log("Warning: No styles.css found. Run build:css first.");
}

console.log("\nBuild complete!");
