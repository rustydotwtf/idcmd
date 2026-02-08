import { ZodError, z } from "zod";

export const SearchScopeSchema = z.enum([
  "full",
  "title",
  "title_and_description",
]);
export type SearchScope = z.infer<typeof SearchScopeSchema>;

export const RightRailVisibleFromSchema = z.enum([
  "xl",
  "lg",
  "md",
  "always",
  "never",
]);
export type RightRailVisibleFrom = z.infer<typeof RightRailVisibleFromSchema>;

export const ScrollSpyUpdateHashSchema = z.enum(["never", "replace", "push"]);
export type ScrollSpyUpdateHash = z.infer<typeof ScrollSpyUpdateHashSchema>;

export const TocLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
export type TocLevel = z.infer<typeof TocLevelSchema>;

export const RightRailScrollSpyConfigSchema = z
  .object({
    centerActiveItem: z.boolean().optional(),
    enabled: z.boolean().optional(),
    updateHash: ScrollSpyUpdateHashSchema.optional(),
  })
  .strict();
export type RightRailScrollSpyConfig = z.infer<
  typeof RightRailScrollSpyConfigSchema
>;

export const RightRailConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    placement: z.enum(["content", "viewport"]).optional(),
    scrollSpy: RightRailScrollSpyConfigSchema.optional(),
    smoothScroll: z.boolean().optional(),
    tocLevels: z.array(TocLevelSchema).optional(),
    visibleFrom: RightRailVisibleFromSchema.optional(),
  })
  .strict();
export type RightRailConfig = z.infer<typeof RightRailConfigSchema>;

export const GroupConfigSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    order: z.number().int(),
  })
  .strict();
export type GroupConfig = z.infer<typeof GroupConfigSchema>;

export const SiteConfigSchema = z
  .object({
    baseUrl: z.string().url().optional(),
    description: z.string(),
    groups: z.array(GroupConfigSchema).optional(),
    name: z.string().min(1),
    rightRail: RightRailConfigSchema.optional(),
    search: z
      .object({
        scope: SearchScopeSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type SiteConfig = z.infer<typeof SiteConfigSchema>;

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

const SITE_CONFIG_PATH = "site.jsonc";
const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

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
  config?: RightRailConfig
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

const isLocalhostBaseUrl = (baseUrl: string): boolean => {
  try {
    const url = new URL(baseUrl);
    return LOCALHOST_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
};

const normalizeBaseUrl = (baseUrl: string): string | undefined => {
  try {
    const url = new URL(baseUrl);
    // Canonicalize to origin (strip path/query/hash).
    return url.origin;
  } catch {
    return undefined;
  }
};

const resolveBaseUrlFromEnv = (): string | undefined => {
  const explicit = process.env.SITE_BASE_URL;
  if (explicit) {
    return normalizeBaseUrl(explicit);
  }

  // Vercel provides hostnames without protocol.
  const vercelUrl =
    process.env.VERCEL_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_BRANCH_URL;

  if (vercelUrl) {
    return normalizeBaseUrl(`https://${vercelUrl}`);
  }

  return undefined;
};

const resolveBaseUrl = (baseUrl: string | undefined): string | undefined => {
  const normalizedConfigUrl = baseUrl ? normalizeBaseUrl(baseUrl) : undefined;
  const envUrl = resolveBaseUrlFromEnv();

  // If config is set to localhost (common for dev), prefer env-derived URL when available.
  if (normalizedConfigUrl && !isLocalhostBaseUrl(normalizedConfigUrl)) {
    return normalizedConfigUrl;
  }

  return envUrl ?? normalizedConfigUrl;
};

const formatZodIssuePath = (path: readonly (string | number)[]): string =>
  path.length === 0 ? "(root)" : path.join(".");

const formatSiteConfigZodError = (error: ZodError): string => {
  const lines = error.issues.map(
    (issue) => `${formatZodIssuePath(issue.path)}: ${issue.message}`
  );
  return `site.jsonc validation failed:\n${lines.join("\n")}`;
};

const DEFAULT_SITE_CONFIG: SiteConfig = { description: "", name: "idcmd" };

const parseSiteConfigJsonc = (text: string): unknown => {
  try {
    return Bun.JSONC.parse(text) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse ${SITE_CONFIG_PATH} as JSONC: ${message}`,
      {
        cause: error,
      }
    );
  }
};

const parseSiteConfigUnknown = (raw: unknown): SiteConfig => {
  try {
    return SiteConfigSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new TypeError(formatSiteConfigZodError(error), { cause: error });
    }
    throw error;
  }
};

export const loadSiteConfig = async (): Promise<SiteConfig> => {
  const file = Bun.file(SITE_CONFIG_PATH);
  if (!(await file.exists())) {
    return DEFAULT_SITE_CONFIG;
  }

  const text = await file.text();
  const raw = parseSiteConfigJsonc(text);
  const parsed = parseSiteConfigUnknown(raw);
  return { ...parsed, baseUrl: resolveBaseUrl(parsed.baseUrl) };
};

export const getSearchScope = (siteConfig: SiteConfig): SearchScope =>
  siteConfig.search?.scope ?? "full";
