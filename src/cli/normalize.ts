export const parsePort = (raw: unknown, fallback: number): number => {
  if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw !== "string") {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const toPackageName = (input: string): string => {
  const trimmed = input.trim().toLowerCase();
  const replaced = trimmed
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9-_]/g, "");
  const collapsed = replaced
    .replaceAll(/-+/g, "-")
    .replaceAll(/^[-_]+|[-_]+$/g, "");
  return collapsed.length > 0 ? collapsed : "idcmd-site";
};

export const normalizeOptionalString = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};
