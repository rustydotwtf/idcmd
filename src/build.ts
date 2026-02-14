import { expandMarkdownForAgent } from "./content/components/expand";
import { generateLlmsTxt } from "./content/llms";
import { discoverNavigation } from "./content/navigation";
import { scanContentFiles, slugFromContentFile } from "./content/paths";
import { getProjectPaths } from "./project/paths";
import { renderDocument, renderMarkdownPage } from "./render/page-renderer";
import { generateSearchIndexFromContent } from "./search/index";
import { getRenderSearchPageContent } from "./search/search-page-loader";
import {
  collectSitemapPagesFromContent,
  generateRobotsTxt,
  generateSitemapXml,
} from "./seo/files";
import { loadSiteConfig, resolveRightRailConfig } from "./site/config";
import { resolveCanonicalUrl } from "./site/urls";

const MAX_INDEX_BYTES = 5 * 1024 * 1024;
const MAX_BUILD_SECONDS = 60;
const MIN_SEARCH_QUERY_LENGTH = 2;

const project = await getProjectPaths();

// Find all content files in `site/content/` (`site/content/<slug>.md`).
const contentFiles: string[] = [];

const buildStart = performance.now();

for await (const file of scanContentFiles()) {
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

// Ensure output directory exists
await Bun.write(`${project.outputDir}/.gitkeep`, "");

const shouldCopyAssetPath = (relativePath: string): boolean =>
  // Do not overwrite the minified `public/styles.css` produced by `build:css`.
  relativePath !== "styles.css";

const copyAssetFileToOutput = async (relativePath: string): Promise<void> => {
  const file = Bun.file(`${project.assetsDir}/${relativePath}`);
  if (!(await file.exists())) {
    return;
  }
  await Bun.write(`${project.outputDir}/${relativePath}`, file);
};

const copyAssetsToOutput = async (): Promise<void> => {
  const assetFiles = new Bun.Glob("**/*").scan(project.assetsDir);
  for await (const relativePath of assetFiles) {
    if (shouldCopyAssetPath(relativePath)) {
      await copyAssetFileToOutput(relativePath);
    }
  }
};

const writeMarkdownOutputs = async (
  slug: string,
  markdown: string
): Promise<void> => {
  const flatMarkdownPath =
    slug === "index"
      ? `${project.outputDir}/index.md`
      : `${project.outputDir}/${slug}.md`;

  const expanded = await expandMarkdownForAgent(markdown, {
    currentPath: slug === "index" ? "/" : `/${slug}/`,
    instanceId: `${slug}:build-md`,
    isDev: false,
    slug,
  });

  await Bun.write(flatMarkdownPath, expanded);
  console.log(`  markdown -> ${flatMarkdownPath}`);
};

await copyAssetsToOutput();

const resolveCssSource = async (): Promise<string | null> => {
  if (await Bun.file(`${project.outputDir}/styles.css`).exists()) {
    return `${project.outputDir}/styles.css`;
  }
  if (await Bun.file(`${project.assetsDir}/styles.css`).exists()) {
    return `${project.assetsDir}/styles.css`;
  }
  return null;
};

const cssSource = await resolveCssSource();
const inlineCss = cssSource ? await Bun.file(cssSource).text() : undefined;
const cssPath = inlineCss ? undefined : "/styles.css";

const renderStaticSearchPage = async (): Promise<string> => {
  const renderSearchPage = await getRenderSearchPageContent();
  const topPages = navigation
    .flatMap((group) => group.items)
    .slice(0, 8)
    .map((item) => ({ href: item.href, title: item.title }));

  const contentHtml = renderSearchPage({
    minQueryLength: MIN_SEARCH_QUERY_LENGTH,
    query: "",
    results: [],
    topPages,
  });

  const rightRail = resolveRightRailConfig(siteConfig.rightRail);
  const canonicalUrl = resolveCanonicalUrl(
    { configuredBaseUrl: siteConfig.baseUrl, isDev: false },
    "/search/"
  );

  return renderDocument({
    canonicalUrl,
    contentHtml,
    cssPath,
    currentPath: "/search/",
    description: siteConfig.description,
    inlineCss,
    navigation,
    rightRail,
    searchQuery: "",
    showRightRail: false,
    siteName: siteConfig.name,
    title: `Search - ${siteConfig.name}`,
    tocItems: [],
  });
};

await Bun.write(
  `${project.outputDir}/search/index.html`,
  await renderStaticSearchPage()
);
console.log(`  generated ${project.outputDir}/search/index.html`);

for (const file of contentFiles) {
  const filePath = `${project.contentDir}/${file}`;
  const markdown = await Bun.file(filePath).text();

  const slug = slugFromContentFile(file);
  const currentPath = slug === "index" ? "/" : `/${slug}/`;

  const html = await renderMarkdownPage(markdown, {
    cssPath,
    currentPath,
    inlineCss,
    navigation,
    siteConfig,
  });

  let outPath: string;
  if (slug === "index") {
    outPath = `${project.outputDir}/index.html`;
  } else if (slug === "404") {
    outPath = `${project.outputDir}/404.html`;
  } else {
    outPath = `${project.outputDir}/${slug}/index.html`;
  }

  await Bun.write(outPath, html);
  console.log(`  ${filePath} -> ${outPath}`);
  await writeMarkdownOutputs(slug, markdown);

  if (slug === "404") {
    const nested404Path = `${project.outputDir}/404/index.html`;
    await Bun.write(nested404Path, html);
    console.log(`  ${filePath} -> ${nested404Path}`);
  }
}

const llmsTxt = await generateLlmsTxt();
await Bun.write(`${project.outputDir}/llms.txt`, llmsTxt);
console.log(`  generated ${project.outputDir}/llms.txt`);

const searchIndex = await generateSearchIndexFromContent({ siteConfig });
await Bun.write(
  `${project.outputDir}/search-index.json`,
  JSON.stringify(searchIndex)
);
const searchIndexBytes = Bun.file(
  `${project.outputDir}/search-index.json`
).size;
console.log(
  `  generated public/search-index.json (${(searchIndexBytes / (1024 * 1024)).toFixed(2)} MB)`
);
if (searchIndexBytes > MAX_INDEX_BYTES) {
  console.warn(
    `Warning: search index exceeds target of 5 MB (${searchIndexBytes} bytes)`
  );
}

if (siteConfig.baseUrl) {
  const sitemapPages = await collectSitemapPagesFromContent();
  await Bun.write(
    `${project.outputDir}/sitemap.xml`,
    generateSitemapXml(sitemapPages, siteConfig.baseUrl)
  );
  console.log(`  generated ${project.outputDir}/sitemap.xml`);

  await Bun.write(
    `${project.outputDir}/robots.txt`,
    generateRobotsTxt(siteConfig.baseUrl)
  );
  console.log(`  generated ${project.outputDir}/robots.txt`);
} else {
  console.log(
    "Warning: site/site.jsonc missing baseUrl; skipping sitemap.xml and robots.txt."
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
