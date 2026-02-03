/**
 * Navigation discovery utility
 * Scans content folders and builds navigation structure from frontmatter.
 */

import { parseFrontmatter, extractTitleFromContent } from "./frontmatter";

export interface NavItem {
  title: string;
  href: string;
  iconSvg: string; // SVG content for the icon
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
async function loadSiteConfig(): Promise<SiteConfig> {
  const file = Bun.file("site.jsonc");
  if (await file.exists()) {
    const text = await file.text();
    return Bun.JSONC.parse(text) as SiteConfig;
  }
  return { description: "", name: "Markdown Site" };
}

/**
 * Load an icon by name from the icons directory.
 * Returns the SVG content or undefined if not found.
 */
async function loadIconByName(name: string): Promise<string | undefined> {
  const iconFile = `${ICONS_DIR}/${name}.svg`;
  const file = Bun.file(iconFile);

  if (await file.exists()) {
    return file.text();
  }
  return undefined;
}

/**
 * Load a custom icon from a content folder.
 * The path should be relative (e.g., "./icon.svg").
 */
async function loadCustomIcon(
  slug: string,
  iconPath: string
): Promise<string | undefined> {
  const iconFile = `${CONTENT_DIR}/${slug}/${iconPath.slice(2)}`;
  const file = Bun.file(iconFile);

  if (await file.exists()) {
    return file.text();
  }

  console.warn(`Custom icon not found: ${iconFile}`);
  return undefined;
}

/**
 * Resolve an icon specification to SVG content.
 * - "./icon.svg" -> loads from content/<slug>/icon.svg
 * - "home" -> loads from icons/home.svg
 * - Falls back to default file icon
 */
async function resolveIcon(slug: string, icon: string): Promise<string> {
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
}

/**
 * Discover all pages and build navigation structure.
 * Reads frontmatter from each content.md file to determine:
 * - Title (falls back to h1)
 * - Icon (loaded from icons/ folder or custom path)
 * - Group (for sidebar sections)
 * - Order (sort order within group)
 */
export async function discoverNavigation(): Promise<NavGroup[]> {
  const siteConfig = await loadSiteConfig();
  const glob = new Bun.Glob("*/content.md");

  // Map of group ID -> NavGroup
  const groupsMap = new Map<string, NavGroup>();

  // Initialize groups from config
  const configGroups = siteConfig.groups ?? [];
  for (const group of configGroups) {
    groupsMap.set(group.id, {
      id: group.id,
      items: [],
      label: group.label,
      order: group.order,
    });
  }

  // Default group for pages without a group specified
  const defaultGroup: NavGroup = {
    id: "_default",
    items: [],
    label: "Pages",
    order: 999,
  };

  // Scan all content folders
  for await (const file of glob.scan(CONTENT_DIR)) {
    const slug = file.replace("/content.md", "");
    const markdown = await Bun.file(`${CONTENT_DIR}/${file}`).text();
    const { frontmatter, content } = parseFrontmatter(markdown);

    // Skip hidden pages
    if (frontmatter.hidden) {
      continue;
    }

    // Determine title
    const title = frontmatter.title ?? extractTitleFromContent(content) ?? slug;

    // Determine href
    const href = slug === "index" ? "/" : `/${slug}`;

    // Resolve icon to SVG content
    const iconName = frontmatter.icon ?? "file";
    const iconSvg = await resolveIcon(slug, iconName);

    const navItem: NavItem = {
      href,
      iconSvg,
      order: frontmatter.order ?? 100,
      title,
    };

    // Add to appropriate group
    const groupId = frontmatter.group;
    if (groupId && groupsMap.has(groupId)) {
      groupsMap.get(groupId)!.items.push(navItem);
    } else if (groupId) {
      // Group specified but not in config, create it
      if (!groupsMap.has(groupId)) {
        groupsMap.set(groupId, {
          id: groupId,
          items: [],
          label: groupId.charAt(0).toUpperCase() + groupId.slice(1),
          order: 100,
        });
      }
      groupsMap.get(groupId)!.items.push(navItem);
    } else {
      // No group specified, add to default
      defaultGroup.items.push(navItem);
    }
  }

  // Add default group if it has items
  if (defaultGroup.items.length > 0) {
    groupsMap.set(defaultGroup.id, defaultGroup);
  }

  // Convert to array, sort groups by order, and sort items within each group
  const groups = [...groupsMap.values()]
    .filter((g) => g.items.length > 0)
    .toSorted((a, b) => a.order - b.order);

  for (const group of groups) {
    group.items.sort((a, b) => a.order - b.order);
  }

  return groups;
}
