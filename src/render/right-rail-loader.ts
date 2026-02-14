import type { RightRailComponent } from "./right-rail";

import { RightRail as defaultRightRail } from "./right-rail";

const USER_RIGHT_RAIL_PATH = "src/ui/right-rail.tsx";

const loadUserRightRail = async (
  filePath: string
): Promise<RightRailComponent | null> => {
  try {
    const url = Bun.pathToFileURL(filePath);
    const mod = (await import(url.toString())) as unknown as {
      RightRail?: RightRailComponent;
    };
    return mod.RightRail ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[right-rail] Failed to load user right rail from ${filePath}: ${message}`
    );
    return null;
  }
};

const tryLoadUserRightRail = async (): Promise<RightRailComponent | null> => {
  const exists = await Bun.file(USER_RIGHT_RAIL_PATH).exists();
  if (!exists) {
    return null;
  }
  return loadUserRightRail(USER_RIGHT_RAIL_PATH);
};

let cached: RightRailComponent | null = null;
let attempted = false;

export const getRightRail = async (): Promise<RightRailComponent> => {
  if (attempted) {
    return cached ?? defaultRightRail;
  }

  attempted = true;
  cached = await tryLoadUserRightRail();
  return cached ?? defaultRightRail;
};

export const resetRightRailLoaderForTests = (): void => {
  cached = null;
  attempted = false;
};
