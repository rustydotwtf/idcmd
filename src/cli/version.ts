import { joinPath } from "./path";

export const readPackageVersion = async (): Promise<string> => {
  try {
    const pkgPath = joinPath(import.meta.dir, "..", "..", "package.json");
    const raw = (await Bun.file(pkgPath).json()) as unknown;
    const record = raw as Record<string, unknown>;
    return typeof record.version === "string" ? record.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
};
