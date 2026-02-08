import type { ZodType } from "zod";

export interface DocComponentContext {
  currentPath: string;
  instanceId: string;
  isDev: boolean;
  slug: string;
}

export interface DocComponent<Props> {
  name: string;
  schema: ZodType<Props>;
  renderHtml: (
    props: Props,
    ctx: DocComponentContext
  ) => string | Promise<string>;
  renderMarkdown: (
    props: Props,
    ctx: DocComponentContext
  ) => string | Promise<string>;
}
