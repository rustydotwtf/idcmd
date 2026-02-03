import { Glob } from "bun";

import { parseFrontmatter, extractTitleFromContent } from "./frontmatter";
import { renderLayout } from "./layout";
import { discoverNavigation } from "./navigation";
import { highlightCodeBlocks } from "./render";

// Find all content.md files in content/<slug>/ directories
const glob = new Glob("*/content.md");
const contentFiles: string[] = [];

for await (const file of glob.scan("content")) {
  contentFiles.push(`content/${file}`);
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

for (const file of contentFiles) {
  const markdown = await Bun.file(file).text();

  // Parse frontmatter
  const { frontmatter, content } = parseFrontmatter(markdown);

  // Determine title: frontmatter > h1 extraction
  const title = frontmatter.title ?? extractTitleFromContent(content);

  // Convert markdown to HTML and apply syntax highlighting
  let contentHtml = Bun.markdown.html(content, {
    autolinks: true,
    hardSoftBreaks: true,
    headings: true,
    latexMath: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
    underline: true,
    wikiLinks: true,
  });
  contentHtml = await highlightCodeBlocks(contentHtml);

  // Determine output path and current path for navigation
  // content/index/content.md -> dist/index.html, path: /
  // content/about/content.md -> dist/about/index.html, path: /about
  const slug = file.replace("content/", "").replace("/content.md", "");
  const currentPath = slug === "index" ? "/" : `/${slug}`;

  const html = renderLayout({
    content: contentHtml,
    cssPath: "/styles.css",
    currentPath,
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
  console.log(`  ${file} -> ${outPath}`);
}

// Copy CSS to dist
const cssSource = (await Bun.file("dist/styles.css").exists())
  ? "dist/styles.css"
  : "public/styles.css";

if (await Bun.file(cssSource).exists()) {
  console.log(`CSS already at dist/styles.css`);
} else {
  console.log("Warning: No styles.css found. Run build:css first.");
}

console.log("\nBuild complete!");
