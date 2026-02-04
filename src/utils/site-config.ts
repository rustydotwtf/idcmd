export type SearchScope = "full" | "title" | "title_and_description";

export interface GroupConfig {
  id: string;
  label: string;
  order: number;
}

export interface SiteConfig {
  name: string;
  description: string;
  groups?: GroupConfig[];
  search?: {
    scope?: SearchScope;
  };
}

const SITE_CONFIG_PATH = "site.jsonc";

export const loadSiteConfig = async (): Promise<SiteConfig> => {
  const file = Bun.file(SITE_CONFIG_PATH);
  if (await file.exists()) {
    const text = await file.text();
    return Bun.JSONC.parse(text) as SiteConfig;
  }

  return { description: "", name: "Markdown Site" };
};

export const getSearchScope = (siteConfig: SiteConfig): SearchScope =>
  siteConfig.search?.scope ?? "full";
