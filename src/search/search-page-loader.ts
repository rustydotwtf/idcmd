import type { RenderSearchPageContent } from "./page";

import { renderSearchPageContent as defaultRenderSearchPageContent } from "./page";

const USER_SEARCH_PAGE_PATH = "site/client/search-page.tsx";

const loadUserSearchPage = async (
  filePath: string
): Promise<RenderSearchPageContent | null> => {
  try {
    const url = Bun.pathToFileURL(filePath);
    const mod = (await import(url.toString())) as unknown as {
      renderSearchPageContent?: RenderSearchPageContent;
    };
    return mod.renderSearchPageContent ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[search-page] Failed to load user search page from ${filePath}: ${message}`
    );
    return null;
  }
};

const tryLoadUserSearchPage =
  async (): Promise<RenderSearchPageContent | null> => {
    const exists = await Bun.file(USER_SEARCH_PAGE_PATH).exists();
    if (!exists) {
      return null;
    }
    return loadUserSearchPage(USER_SEARCH_PAGE_PATH);
  };

let cached: RenderSearchPageContent | null = null;
let attempted = false;

export const getRenderSearchPageContent =
  async (): Promise<RenderSearchPageContent> => {
    if (attempted) {
      return cached ?? defaultRenderSearchPageContent;
    }

    attempted = true;
    cached = await tryLoadUserSearchPage();
    return cached ?? defaultRenderSearchPageContent;
  };

export const resetSearchPageLoaderForTests = (): void => {
  cached = null;
  attempted = false;
};
