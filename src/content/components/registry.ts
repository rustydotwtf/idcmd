import type { DocComponent } from "./types";

import { InstallTabs } from "./install-tabs";

type AnyDocComponent = DocComponent<unknown>;

const COMPONENTS: Record<string, AnyDocComponent> = {
  InstallTabs: InstallTabs as unknown as AnyDocComponent,
};

export const getDocComponent = (name: string): AnyDocComponent | undefined =>
  COMPONENTS[name];
