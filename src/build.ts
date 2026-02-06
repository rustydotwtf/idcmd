import { generateLlmsTxt } from "./content";
import { parseFrontmatter } from "./frontmatter";
import { renderLayout } from "./layout";
import { discoverNavigation } from "./navigation";
import { deriveDescription, deriveTitle } from "./page-meta";
import { highlightCodeBlocks } from "./render";
import { generateSearchIndexFromContent } from "./search-index";
import { renderSearchPageContent } from "./search-page";
import {
  collectSitemapPagesFromContent,
  generateRobotsTxt,
  generateSitemapXml,
} from "./seo-files";
import { resolveAbsoluteUrl } from "./url-utils";
import {
  CONTENT_DIR,
  contentGlob,
  slugFromContentFile,
} from "./utils/content-paths";
import { renderMarkdownToHtml } from "./utils/markdown";
import { loadSiteConfig } from "./utils/site-config";

const MAX_INDEX_BYTES = 5 * 1024 * 1024;
const MAX_BUILD_SECONDS = 60;
const MIN_SEARCH_QUERY_LENGTH = 2;

// Find all content.md files in content/<slug>/ directories
const contentFiles: string[] = [];

const buildStart = performance.now();

for await (const file of contentGlob.scan(CONTENT_DIR)) {
  contentFiles.push(file);
}

console.log(`Found ${contentFiles.length} content pages`);

const siteConfig = await loadSiteConfig();

// Discover navigation once for all pages
console.log("Discovering navigation...");
const navigation = await discoverNavigation();
console.log(
  `Found ${navigation.length} groups with ${navigation.reduce((acc, g) => acc + g.items.length, 0)} total pages`
);

// Ensure dist directory exists
await Bun.write("dist/.gitkeep", "");

const copyPublicFile = async (fileName: string): Promise<void> => {
  const source = `public/${fileName}`;
  const target = `dist/${fileName}`;
  const file = Bun.file(source);

  if (await file.exists()) {
    await Bun.write(target, file);
  }
};

const writeMarkdownOutputs = async (
  slug: string,
  markdown: string
): Promise<void> => {
  const flatMarkdownPath =
    slug === "index" ? "dist/index.md" : `dist/${slug}.md`;
  const nestedMarkdownPath =
    slug === "index" ? "dist/index/content.md" : `dist/${slug}/content.md`;

  await Bun.write(flatMarkdownPath, markdown);
  await Bun.write(nestedMarkdownPath, markdown);
  console.log(`  markdown -> ${flatMarkdownPath}`);
};

const staticAssets = [
  "favicon.svg",
  "live-reload.js",
  "nav-prefetch.js",
  "search.js",
] as const;

for (const asset of staticAssets) {
  await copyPublicFile(asset);
}

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

const renderStaticSearchPage = (): string => {
  const topPages = navigation
    .flatMap((group) => group.items)
    .slice(0, 8)
    .map((item) => ({ href: item.href, title: item.title }));

  const content = renderSearchPageContent({
    minQueryLength: MIN_SEARCH_QUERY_LENGTH,
    query: "",
    results: [],
    topPages,
  });

  const canonicalUrl = resolveAbsoluteUrl(siteConfig.baseUrl, "/search/");

  return renderLayout({
    canonicalUrl,
    content,
    cssPath,
    currentPath: "/search/",
    description: siteConfig.description,
    inlineCss,
    navigation,
    searchQuery: "",
    title: `Search - ${siteConfig.name}`,
  });
};

await Bun.write("dist/search/index.html", renderStaticSearchPage());
console.log("  generated dist/search/index.html");

for (const file of contentFiles) {
  const filePath = `${CONTENT_DIR}/${file}`;
  const markdown = await Bun.file(filePath).text();

  // Parse frontmatter
  const { content } = parseFrontmatter(markdown);

  const title = deriveTitle(markdown);
  const description = deriveDescription(markdown, siteConfig.description);

  // Convert markdown to HTML and apply syntax highlighting
  let contentHtml = renderMarkdownToHtml(content);
  contentHtml = await highlightCodeBlocks(contentHtml);

  // Determine output path and current path for navigation
  // content/index/content.md -> dist/index.html, path: /
  // content/about/content.md -> dist/about/index.html, path: /about
  const slug = slugFromContentFile(file);
  const currentPath = slug === "index" ? "/" : `/${slug}/`;
  const canonicalUrl = resolveAbsoluteUrl(siteConfig.baseUrl, currentPath);

  const html = renderLayout({
    canonicalUrl,
    content: contentHtml,
    cssPath,
    currentPath,
    description,
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
  await writeMarkdownOutputs(slug, markdown);

  if (slug === "404") {
    const nested404Path = "dist/404/index.html";
    await Bun.write(nested404Path, html);
    console.log(`  ${filePath} -> ${nested404Path}`);
  }
}

const llmsTxt = await generateLlmsTxt();
await Bun.write("dist/llms.txt", llmsTxt);
console.log("  generated dist/llms.txt");

const searchIndex = await generateSearchIndexFromContent({ siteConfig });
await Bun.write("dist/search-index.json", JSON.stringify(searchIndex));
const searchIndexBytes = Bun.file("dist/search-index.json").size;
console.log(
  `  generated dist/search-index.json (${(searchIndexBytes / (1024 * 1024)).toFixed(2)} MB)`
);
if (searchIndexBytes > MAX_INDEX_BYTES) {
  console.warn(
    `Warning: search index exceeds target of 5 MB (${searchIndexBytes} bytes)`
  );
}

if (siteConfig.baseUrl) {
  const sitemapPages = await collectSitemapPagesFromContent();
  await Bun.write(
    "dist/sitemap.xml",
    generateSitemapXml(sitemapPages, siteConfig.baseUrl)
  );
  console.log("  generated dist/sitemap.xml");

  await Bun.write("dist/robots.txt", generateRobotsTxt(siteConfig.baseUrl));
  console.log("  generated dist/robots.txt");
} else {
  console.log(
    "Warning: site.jsonc missing baseUrl; skipping sitemap.xml and robots.txt."
  );
}

if (cssSource) {
  console.log(`Using CSS from ${cssSource}`);
} else {
  console.log("Warning: No styles.css found. Run build:css first.");
}

const buildSeconds = (performance.now() - buildStart) / 1000;
console.log(`Build duration: ${buildSeconds.toFixed(2)}s`);
if (buildSeconds > MAX_BUILD_SECONDS) {
  console.warn(`Warning: build exceeds target of ${MAX_BUILD_SECONDS}s`);
}

console.log("\nBuild complete!");
