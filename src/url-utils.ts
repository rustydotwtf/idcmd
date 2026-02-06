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
