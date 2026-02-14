import type { RenderLayout } from "./layout";

import { renderLayout as defaultRenderLayout } from "./layout";

const USER_LAYOUT_PATH = "site/client/layout.tsx";

const loadUserLayout = async (
  filePath: string
): Promise<RenderLayout | null> => {
  try {
    const url = Bun.pathToFileURL(filePath);
    const mod = (await import(url.toString())) as unknown as {
      renderLayout?: RenderLayout;
    };
    return mod.renderLayout ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[layout] Failed to load user layout from ${filePath}: ${message}`
    );
    return null;
  }
};

const tryLoadUserRenderLayout = async (): Promise<RenderLayout | null> => {
  const exists = await Bun.file(USER_LAYOUT_PATH).exists();
  if (!exists) {
    return null;
  }
  return loadUserLayout(USER_LAYOUT_PATH);
};

let cached: RenderLayout | null = null;
let attempted = false;

export const getRenderLayout = async (): Promise<RenderLayout> => {
  if (attempted) {
    return cached ?? defaultRenderLayout;
  }

  attempted = true;
  cached = await tryLoadUserRenderLayout();
  return cached ?? defaultRenderLayout;
};

export const resetLayoutLoaderForTests = (): void => {
  cached = null;
  attempted = false;
};
