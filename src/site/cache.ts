import { z } from "zod";

const MAX_EDGE_CACHE_SECONDS = 7 * 24 * 60 * 60;
const MAX_STALE_SECONDS = 30 * 24 * 60 * 60;

const HTML_REVALIDATE_CACHE_CONTROL = "public, max-age=0, must-revalidate";
const STATIC_REVALIDATE_CACHE_CONTROL = "public, max-age=0, must-revalidate";
const STATIC_IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
const NO_STORE_CACHE_CONTROL = "no-store";

export const CachePresetSchema = z.enum(["fresh", "balanced", "static"]);
export type CachePreset = z.infer<typeof CachePresetSchema>;

export const CacheHtmlConfigSchema = z
  .object({
    sMaxAgeSeconds: z
      .number()
      .int()
      .min(0)
      .max(MAX_EDGE_CACHE_SECONDS)
      .optional(),
    staleWhileRevalidateSeconds: z
      .number()
      .int()
      .min(0)
      .max(MAX_STALE_SECONDS)
      .optional(),
  })
  .strict();
export type CacheHtmlConfig = z.infer<typeof CacheHtmlConfigSchema>;

export const CacheConfigSchema = z
  .object({
    html: CacheHtmlConfigSchema.optional(),
    preset: CachePresetSchema.optional(),
  })
  .strict();
export type CacheConfig = z.infer<typeof CacheConfigSchema>;

export interface ResolvedCachePolicy {
  html: {
    browserCacheControl: string;
    edgeCacheControl: string | null;
  };
  preset: CachePreset;
  static: {
    cacheControl: string;
  };
}

interface HtmlEdgePolicy {
  sMaxAgeSeconds: number;
  staleWhileRevalidateSeconds: number;
}

const DEFAULT_HTML_EDGE_POLICY: HtmlEdgePolicy = {
  sMaxAgeSeconds: 60,
  staleWhileRevalidateSeconds: 3600,
};
const DEFAULT_PRESET: CachePreset = "static";

const formatEdgeCacheControl = (policy: HtmlEdgePolicy): string =>
  `s-maxage=${String(policy.sMaxAgeSeconds)}, stale-while-revalidate=${String(policy.staleWhileRevalidateSeconds)}`;

const resolveHtmlEdgePolicy = (
  config: CacheConfig | undefined
): HtmlEdgePolicy => ({
  sMaxAgeSeconds:
    config?.html?.sMaxAgeSeconds ?? DEFAULT_HTML_EDGE_POLICY.sMaxAgeSeconds,
  staleWhileRevalidateSeconds:
    config?.html?.staleWhileRevalidateSeconds ??
    DEFAULT_HTML_EDGE_POLICY.staleWhileRevalidateSeconds,
});

const resolvePreset = (config: CacheConfig | undefined): CachePreset =>
  config?.preset ?? DEFAULT_PRESET;

export const resolveCachePolicy = (
  config?: CacheConfig
): ResolvedCachePolicy => {
  const preset = resolvePreset(config);

  if (preset === "fresh") {
    return {
      html: {
        browserCacheControl: NO_STORE_CACHE_CONTROL,
        edgeCacheControl: null,
      },
      preset,
      static: { cacheControl: NO_STORE_CACHE_CONTROL },
    };
  }

  const edgePolicy = resolveHtmlEdgePolicy(config);
  return {
    html: {
      browserCacheControl: HTML_REVALIDATE_CACHE_CONTROL,
      edgeCacheControl: formatEdgeCacheControl(edgePolicy),
    },
    preset,
    static: {
      cacheControl:
        preset === "static"
          ? STATIC_IMMUTABLE_CACHE_CONTROL
          : STATIC_REVALIDATE_CACHE_CONTROL,
    },
  };
};
