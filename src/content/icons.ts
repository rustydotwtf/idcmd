import { getProjectPaths } from "../project/paths";

const FALLBACK_ICON_NAME = "file";
const FALLBACK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;

const iconFileCache = new Map<string, Promise<string | undefined>>();

const readSvgFile = async (path: string): Promise<string | undefined> => {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    return undefined;
  }
  return file.text();
};

const getCachedSvgFile = (path: string): Promise<string | undefined> => {
  const cached = iconFileCache.get(path);
  if (cached) {
    return cached;
  }

  const pending = readSvgFile(path);
  iconFileCache.set(path, pending);
  return pending;
};

const getNamedIconPath = async (name: string): Promise<string> => {
  const { iconsDir } = await getProjectPaths();
  return `${iconsDir}/${name}.svg`;
};

const loadCustomIcon = async (
  slug: string,
  iconPath: string
): Promise<string | undefined> => {
  const { contentDir } = await getProjectPaths();
  const resolvedPath = `${contentDir}/${slug}/${iconPath.slice(2)}`;
  const svg = await getCachedSvgFile(resolvedPath);
  if (!svg) {
    console.warn(`Custom icon not found: ${resolvedPath}`);
  }
  return svg;
};

const getFallbackIcon = async (): Promise<string> => {
  const svg = await getCachedSvgFile(
    await getNamedIconPath(FALLBACK_ICON_NAME)
  );
  return svg ?? FALLBACK_ICON_SVG;
};

/**
 * Resolve an icon specification to SVG content.
 * - "./icon.svg" -> loads from content/<slug>/icon.svg
 * - "home" -> loads from icons/home.svg
 * - Falls back to icons/file.svg (or built-in fallback SVG)
 */
export const resolveIconSvg = async (
  slug: string,
  icon: string | undefined
): Promise<string> => {
  if (!icon) {
    return getFallbackIcon();
  }

  if (icon.startsWith("./")) {
    const customSvg = await loadCustomIcon(slug, icon);
    return customSvg ?? (await getFallbackIcon());
  }

  const namedSvg = await getCachedSvgFile(await getNamedIconPath(icon));
  if (namedSvg) {
    return namedSvg;
  }

  console.warn(`Icon "${icon}" not found in icons/ folder for ${slug}`);
  return getFallbackIcon();
};
