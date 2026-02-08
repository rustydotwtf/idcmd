export const trimTrailingSlash = (value: string): string =>
  value.replaceAll(/\/+$/g, "");

export const joinPath = (...parts: string[]): string => {
  let out = "";
  for (const part of parts) {
    if (!part) {
      continue;
    }
    if (part.startsWith("/")) {
      out = trimTrailingSlash(part);
      continue;
    }
    const next = trimTrailingSlash(part.replaceAll(/^\/+/g, ""));
    out = out.length === 0 ? next : `${out}/${next}`;
  }
  return out.length === 0 ? "." : out;
};

export const dirname = (path: string): string => {
  const normalized = trimTrailingSlash(path);
  const idx = normalized.lastIndexOf("/");
  return idx <= 0 ? "." : normalized.slice(0, idx);
};

export const basename = (path: string): string => {
  const normalized = trimTrailingSlash(path);
  const idx = normalized.lastIndexOf("/");
  return idx === -1 ? normalized : normalized.slice(idx + 1);
};
