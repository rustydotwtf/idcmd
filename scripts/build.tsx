import { renderToString } from "react-dom/server";
import { Layout } from "../src/components/Layout";
import { Glob } from "bun";

// Find all markdown files in content/
const glob = new Glob("**/*.md");
const contentFiles: string[] = [];

for await (const file of glob.scan("content")) {
  contentFiles.push(`content/${file}`);
}

console.log(`Found ${contentFiles.length} markdown files`);

// Extract title from markdown (first h1)
function extractTitle(markdown: string): string | undefined {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1];
}

// Ensure dist directory exists
await Bun.write("dist/.gitkeep", "");

for (const file of contentFiles) {
  const markdown = await Bun.file(file).text();
  const content = Bun.markdown.react(markdown);
  const title = extractTitle(markdown);

  const html = `<!DOCTYPE html>${renderToString(
    <Layout title={title} cssPath="/styles.css">
      {content}
    </Layout>
  )}`;

  // Determine output path
  // content/index.md -> dist/index.html
  // content/about.md -> dist/about/index.html
  // content/blog/post.md -> dist/blog/post/index.html
  const slug = file.replace("content/", "").replace(".md", "");

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
