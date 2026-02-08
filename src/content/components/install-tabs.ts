import { z } from "zod";

import type { DocComponent, DocComponentContext } from "./types";

export interface InstallTabsProps {
  dev?: boolean;
  pkg: string;
}

const schema = z
  .object({
    dev: z.boolean().optional(),
    pkg: z.string().min(1),
  })
  .strict() satisfies z.ZodType<InstallTabsProps>;

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type PackageManager = "npm" | "pnpm" | "bun" | "yarn";

const PACKAGE_MANAGERS: readonly PackageManager[] = [
  "npm",
  "pnpm",
  "bun",
  "yarn",
] as const;

const buildInstallCommand = (options: {
  dev: boolean;
  pkg: string;
  pm: PackageManager;
}): string => {
  const devFlag = options.dev;
  const { pkg } = options;

  switch (options.pm) {
    case "npm": {
      return devFlag ? `npm i -D ${pkg}` : `npm i ${pkg}`;
    }
    case "pnpm": {
      return devFlag ? `pnpm add -D ${pkg}` : `pnpm add ${pkg}`;
    }
    case "bun": {
      return devFlag ? `bun add -d ${pkg}` : `bun add ${pkg}`;
    }
    case "yarn": {
      return devFlag ? `yarn add -D ${pkg}` : `yarn add ${pkg}`;
    }
    default: {
      const exhaustiveCheck: never = options.pm;
      throw new Error(`Unknown package manager: ${exhaustiveCheck}`);
    }
  }
};

const buildTabSegmentHtml = (options: {
  code: string;
  defaultPm: PackageManager;
  idPrefix: string;
  pm: PackageManager;
}): string => {
  const inputId = `${options.idPrefix}-${options.pm}`;
  const checkedAttr = options.pm === options.defaultPm ? " checked" : "";

  return [
    `<input class="code-tabs__input" type="radio" name="${options.idPrefix}" id="${inputId}"${checkedAttr} />`,
    `<label class="code-tabs__label" for="${inputId}" data-pm="${options.pm}">${options.pm}</label>`,
    '<div class="code-tabs__panel">',
    `<pre><code class="language-bash">${escapeHtml(options.code)}</code></pre>`,
    "</div>",
  ].join("");
};

const renderInstallTabsHtml = (
  props: InstallTabsProps,
  ctx: DocComponentContext
): string => {
  const dev = props.dev ?? false;
  const pkg = props.pkg.trim();

  const idPrefix = `install-tabs-${ctx.instanceId}`;

  const defaultPm: PackageManager = "npm";

  const segments = PACKAGE_MANAGERS.map((pm) => {
    const code = buildInstallCommand({ dev, pkg, pm });
    return buildTabSegmentHtml({ code, defaultPm, idPrefix, pm });
  }).join("");

  return [
    '<div class="code-tabs" data-code-tabs="install" data-doc-component="InstallTabs">',
    segments,
    "</div>",
  ].join("");
};

const renderInstallTabsMarkdown = (props: InstallTabsProps): string => {
  const dev = props.dev ?? false;
  const pkg = props.pkg.trim();

  const blocks = PACKAGE_MANAGERS.map((pm) => {
    const command = buildInstallCommand({ dev, pkg, pm });
    return [`### ${pm}`, "", "```sh", command, "```", ""].join("\n");
  });

  return blocks.join("\n");
};

export const InstallTabs: DocComponent<InstallTabsProps> = {
  name: "InstallTabs",
  renderHtml: renderInstallTabsHtml,
  renderMarkdown: (props) => renderInstallTabsMarkdown(props),
  schema,
};
