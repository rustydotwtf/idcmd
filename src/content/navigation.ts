/**
 * Navigation discovery utility
 * Scans content folders and builds navigation structure from frontmatter.
 */

import type { GroupConfig } from "@/site/config";

import { loadSiteConfig } from "@/site/config";

import type { PageMeta } from "./frontmatter";

import { parseFrontmatter, extractTitleFromContent } from "./frontmatter";
import { resolveIconSvg } from "./icons";
import { getContentDir, scanContentFiles, slugFromContentFile } from "./paths";

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
  const href = slug === "index" ? "/" : `/${slug}/`;
  const iconSvg = await resolveIconSvg(slug, frontmatter.icon);

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
  defaultGroup: NavGroup,
  contentDir: string
): Promise<void> => {
  const slug = slugFromContentFile(file);
  const markdown = await Bun.file(`${contentDir}/${file}`).text();
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
 * Reads frontmatter from each content file to determine:
 * - Title (falls back to h1)
 * - Icon (loaded from icons/ folder or custom path)
 * - Group (for sidebar sections)
 * - Order (sort order within group)
 */
export const discoverNavigation = async (): Promise<NavGroup[]> => {
  const siteConfig = await loadSiteConfig();
  const contentDir = await getContentDir();

  // Map of group ID -> NavGroup
  const groupsMap = buildGroupsMap(siteConfig.groups ?? []);
  const defaultGroup = createDefaultGroup();

  // Scan all content files
  for await (const file of scanContentFiles()) {
    await addFileToNavigation(file, groupsMap, defaultGroup, contentDir);
  }

  return finalizeGroups(groupsMap, defaultGroup);
};
