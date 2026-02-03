/**
 * Navigation discovery utility
 * Scans content folders and builds navigation structure from frontmatter.
 */

import type { PageMeta } from "./frontmatter";

import { parseFrontmatter, extractTitleFromContent } from "./frontmatter";

export interface NavItem {
  title: string;
  href: string;
  // SVG content for the icon
  iconSvg: string;
  order: number;
}

export interface NavGroup {
  id: string;
  label: string;
  order: number;
  items: NavItem[];
}

export interface GroupConfig {
  id: string;
  label: string;
  order: number;
}

export interface SiteConfig {
  name: string;
  description: string;
  groups?: GroupConfig[];
  search?: {
    scope?: "full" | "title" | "title_and_description";
  };
}

const CONTENT_DIR = "./content";
const ICONS_DIR = "./icons";

// Default fallback icon (file icon)
const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;

/**
 * Load site configuration from site.jsonc
 */
const loadSiteConfig = async (): Promise<SiteConfig> => {
  const file = Bun.file("site.jsonc");
  if (await file.exists()) {
    const text = await file.text();
    return Bun.JSONC.parse(text) as SiteConfig;
  }
  return { description: "", name: "Markdown Site" };
};

/**
 * Load an icon by name from the icons directory.
 * Returns the SVG content or undefined if not found.
 */
const loadIconByName = async (name: string): Promise<string | undefined> => {
  const iconFile = `${ICONS_DIR}/${name}.svg`;
  const file = Bun.file(iconFile);

  if (await file.exists()) {
    return file.text();
  }
  return undefined;
};

/**
 * Load a custom icon from a content folder.
 * The path should be relative (e.g., "./icon.svg").
 */
const loadCustomIcon = async (
  slug: string,
  iconPath: string
): Promise<string | undefined> => {
  const iconFile = `${CONTENT_DIR}/${slug}/${iconPath.slice(2)}`;
  const file = Bun.file(iconFile);

  if (await file.exists()) {
    return file.text();
  }

  console.warn(`Custom icon not found: ${iconFile}`);
  return undefined;
};

/**
 * Resolve an icon specification to SVG content.
 * - "./icon.svg" -> loads from content/<slug>/icon.svg
 * - "home" -> loads from icons/home.svg
 * - Falls back to default file icon
 */
const resolveIcon = async (slug: string, icon: string): Promise<string> => {
  if (icon.startsWith("./")) {
    // Custom icon from content folder
    const svg = await loadCustomIcon(slug, icon);
    return svg ?? DEFAULT_ICON;
  }

  // Try to load from icons directory
  const svg = await loadIconByName(icon);
  if (svg) {
    return svg;
  }

  // Icon not found, warn and use default
  console.warn(
    `Icon "${icon}" not found in icons/ folder for ${slug}, using default`
  );
  return DEFAULT_ICON;
};

const buildGroupsMap = (groups: GroupConfig[]): Map<string, NavGroup> => {
  const groupsMap = new Map<string, NavGroup>();
  for (const group of groups) {
    groupsMap.set(group.id, {
      id: group.id,
      items: [],
      label: group.label,
      order: group.order,
    });
  }
  return groupsMap;
};

const createDefaultGroup = (): NavGroup => ({
  id: "_default",
  items: [],
  label: "Pages",
  order: 999,
});

const createGroupFromId = (groupId: string): NavGroup => ({
  id: groupId,
  items: [],
  label: groupId.charAt(0).toUpperCase() + groupId.slice(1),
  order: 100,
});

const buildNavItem = async (
  slug: string,
  frontmatter: PageMeta,
  content: string
): Promise<NavItem> => {
  const title = frontmatter.title ?? extractTitleFromContent(content) ?? slug;
  const href = slug === "index" ? "/" : `/${slug}`;
  const iconName = frontmatter.icon ?? "file";
  const iconSvg = await resolveIcon(slug, iconName);

  return {
    href,
    iconSvg,
    order: frontmatter.order ?? 100,
    title,
  };
};

const addNavItemToGroups = (
  groupsMap: Map<string, NavGroup>,
  defaultGroup: NavGroup,
  navItem: NavItem,
  groupId: string | undefined
): void => {
  if (!groupId) {
    defaultGroup.items.push(navItem);
    return;
  }

  const existingGroup = groupsMap.get(groupId);
  if (existingGroup) {
    existingGroup.items.push(navItem);
    return;
  }

  const createdGroup = createGroupFromId(groupId);
  createdGroup.items.push(navItem);
  groupsMap.set(groupId, createdGroup);
};

const addFileToNavigation = async (
  file: string,
  groupsMap: Map<string, NavGroup>,
  defaultGroup: NavGroup
): Promise<void> => {
  const slug = file.replace("/content.md", "");
  const markdown = await Bun.file(`${CONTENT_DIR}/${file}`).text();
  const { frontmatter, content } = parseFrontmatter(markdown);

  if (frontmatter.hidden) {
    return;
  }

  const navItem = await buildNavItem(slug, frontmatter, content);
  addNavItemToGroups(groupsMap, defaultGroup, navItem, frontmatter.group);
};

const finalizeGroups = (
  groupsMap: Map<string, NavGroup>,
  defaultGroup: NavGroup
): NavGroup[] => {
  if (defaultGroup.items.length > 0) {
    groupsMap.set(defaultGroup.id, defaultGroup);
  }

  const groups = [...groupsMap.values()]
    .filter((group) => group.items.length > 0)
    .toSorted((a, b) => a.order - b.order);

  for (const group of groups) {
    group.items.sort((a, b) => a.order - b.order);
  }

  return groups;
};

/**
 * Discover all pages and build navigation structure.
 * Reads frontmatter from each content.md file to determine:
 * - Title (falls back to h1)
 * - Icon (loaded from icons/ folder or custom path)
 * - Group (for sidebar sections)
 * - Order (sort order within group)
 */
export const discoverNavigation = async (): Promise<NavGroup[]> => {
  const siteConfig = await loadSiteConfig();
  const glob = new Bun.Glob("*/content.md");

  // Map of group ID -> NavGroup
  const groupsMap = buildGroupsMap(siteConfig.groups ?? []);
  const defaultGroup = createDefaultGroup();

  // Scan all content folders
  for await (const file of glob.scan(CONTENT_DIR)) {
    await addFileToNavigation(file, groupsMap, defaultGroup);
  }

  return finalizeGroups(groupsMap, defaultGroup);
};
