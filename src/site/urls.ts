export const resolveAbsoluteUrl = (
  baseUrl: string | undefined,
  pathname: string
): string | undefined => {
  if (!baseUrl) {
    return undefined;
  }

  // `new URL()` handles joining and normalization.
  return new URL(pathname, baseUrl).toString();
};

export interface CanonicalUrlContext {
  /**
   * If true, prefer the request origin for canonicals so localhost doesn't emit
   * production URLs during development.
   */
  isDev: boolean;
  /**
   * Origin of the current request (ex: "http://localhost:4000").
   * Optional so build-time callers can omit it.
   */
  requestOrigin?: string;
  /**
   * Configured canonical base URL (typically `siteConfig.baseUrl`).
   */
  configuredBaseUrl?: string;
}

export const resolveCanonicalBaseUrl = (
  context: CanonicalUrlContext
): string | undefined => {
  const { configuredBaseUrl, isDev, requestOrigin } = context;

  if (isDev) {
    return requestOrigin;
  }

  return configuredBaseUrl ?? requestOrigin;
};

export const resolveCanonicalUrl = (
  context: CanonicalUrlContext,
  pathname: string
): string | undefined =>
  resolveAbsoluteUrl(resolveCanonicalBaseUrl(context), pathname);
