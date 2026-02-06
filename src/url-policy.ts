const ensureLeadingSlash = (pathname: string): string =>
  pathname.startsWith("/") ? pathname : `/${pathname}`;

const collapseSlashes = (pathname: string): string =>
  pathname.replaceAll(/\/{2,}/g, "/");

const trimTrailingSlash = (pathname: string): string =>
  pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

const lastSegment = (pathname: string): string => {
  const trimmed = trimTrailingSlash(pathname);
  const index = trimmed.lastIndexOf("/");
  return index === -1 ? trimmed : trimmed.slice(index + 1);
};

export const isFileLikePathname = (pathname: string): boolean => {
  const normalized = collapseSlashes(ensureLeadingSlash(pathname));
  const segment = lastSegment(normalized);

  // Treat any last-path segment with an extension as file-like.
  // Examples: /styles.css, /robots.txt, /index/content.md
  const dotIndex = segment.lastIndexOf(".");
  return dotIndex > 0 && dotIndex < segment.length - 1;
};

const stripIndexSegment = (pathname: string): string => {
  if (pathname === "/index") {
    return "/";
  }
  if (pathname.startsWith("/index/")) {
    return `/${pathname.slice("/index/".length)}`;
  }
  return pathname;
};

export const toCanonicalHtmlPathname = (pathname: string): string => {
  const normalized = collapseSlashes(ensureLeadingSlash(pathname));
  if (isFileLikePathname(normalized)) {
    return normalized;
  }

  const withoutIndex = stripIndexSegment(trimTrailingSlash(normalized));
  if (withoutIndex === "/") {
    return "/";
  }

  return withoutIndex.endsWith("/") ? withoutIndex : `${withoutIndex}/`;
};

export const getRedirectForCanonicalHtmlPath = (
  pathname: string
): string | null => {
  const normalized = collapseSlashes(ensureLeadingSlash(pathname));
  if (isFileLikePathname(normalized)) {
    return null;
  }

  const canonical = toCanonicalHtmlPathname(normalized);
  return canonical === normalized ? null : canonical;
};
