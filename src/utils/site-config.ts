export type SearchScope = "full" | "title" | "title_and_description";

export type RightRailVisibleFrom = "xl" | "lg" | "md" | "always" | "never";
export type ScrollSpyUpdateHash = "never" | "replace" | "push";

export type TocLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface RightRailScrollSpyConfig {
  enabled?: boolean;
  centerActiveItem?: boolean;
  updateHash?: ScrollSpyUpdateHash;
}

export interface RightRailConfig {
  enabled?: boolean;
  visibleFrom?: RightRailVisibleFrom;
  placement?: "content" | "viewport";
  tocLevels?: TocLevel[];
  smoothScroll?: boolean;
  scrollSpy?: RightRailScrollSpyConfig;
}

export interface ResolvedRightRailConfig {
  enabled: boolean;
  visibleFrom: RightRailVisibleFrom;
  placement: "content" | "viewport";
  tocLevels: readonly TocLevel[];
  smoothScroll: boolean;
  scrollSpy: {
    enabled: boolean;
    centerActiveItem: boolean;
    updateHash: ScrollSpyUpdateHash;
  };
}

export interface GroupConfig {
  id: string;
  label: string;
  order: number;
}

export interface SiteConfig {
  name: string;
  description: string;
  baseUrl?: string;
  groups?: GroupConfig[];
  search?: {
    scope?: SearchScope;
  };
  rightRail?: RightRailConfig;
}

const SITE_CONFIG_PATH = "site.jsonc";

const DEFAULT_RIGHT_RAIL_CONFIG: ResolvedRightRailConfig = {
  enabled: true,
  placement: "content",
  scrollSpy: {
    centerActiveItem: true,
    enabled: true,
    updateHash: "never",
  },
  smoothScroll: false,
  tocLevels: [2, 3],
  visibleFrom: "xl",
} as const;

export const resolveRightRailConfig = (
  config: RightRailConfig | undefined
): ResolvedRightRailConfig => ({
  enabled: config?.enabled ?? DEFAULT_RIGHT_RAIL_CONFIG.enabled,
  placement: config?.placement ?? DEFAULT_RIGHT_RAIL_CONFIG.placement,
  scrollSpy: {
    centerActiveItem:
      config?.scrollSpy?.centerActiveItem ??
      DEFAULT_RIGHT_RAIL_CONFIG.scrollSpy.centerActiveItem,
    enabled:
      config?.scrollSpy?.enabled ?? DEFAULT_RIGHT_RAIL_CONFIG.scrollSpy.enabled,
    updateHash:
      config?.scrollSpy?.updateHash ??
      DEFAULT_RIGHT_RAIL_CONFIG.scrollSpy.updateHash,
  },
  smoothScroll: config?.smoothScroll ?? DEFAULT_RIGHT_RAIL_CONFIG.smoothScroll,
  tocLevels: [...(config?.tocLevels ?? DEFAULT_RIGHT_RAIL_CONFIG.tocLevels)],
  visibleFrom: config?.visibleFrom ?? DEFAULT_RIGHT_RAIL_CONFIG.visibleFrom,
});

export const loadSiteConfig = async (): Promise<SiteConfig> => {
  const file = Bun.file(SITE_CONFIG_PATH);
  if (await file.exists()) {
    const text = await file.text();
    return Bun.JSONC.parse(text) as SiteConfig;
  }

  return { description: "", name: "Markdown Site" };
};

export const getSearchScope = (siteConfig: SiteConfig): SearchScope =>
  siteConfig.search?.scope ?? "full";
