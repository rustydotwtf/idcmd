// Types matching navigation.ts exports
export interface NavItem {
  title: string;
  href: string;
  iconSvg: string;
  order: number;
}

export interface NavGroup {
  id: string;
  label: string;
  order: number;
  items: NavItem[];
}

interface LayoutProps {
  title?: string;
  content: string;
  cssPath?: string;
  inlineCss?: string;
  currentPath?: string;
  navigation?: NavGroup[];
  scriptPaths?: string[];
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderIcon = (svg: string): string =>
  `<span class="inline-flex w-[18px] h-[18px]">${svg}</span>`;

const isActiveLink = (item: NavItem, currentPath: string): boolean =>
  currentPath === item.href ||
  (item.href !== "/" && currentPath.startsWith(item.href));

const renderNavLink = (item: NavItem, currentPath: string): string => {
  const activeClass = isActiveLink(item, currentPath)
    ? "bg-sidebar-accent text-sidebar-accent-foreground"
    : "";
  const safeTitle = escapeHtml(item.title);

  return `
    <a
      href="${item.href}"
      data-prefetch="hover"
      class="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${activeClass}"
    >
      ${renderIcon(item.iconSvg)}
      <span>${safeTitle}</span>
    </a>
  `;
};

const DEFAULT_SCRIPT_PATHS = ["/nav-prefetch.js"] as const;

const renderNavGroup = (group: NavGroup, currentPath: string): string => {
  const safeLabel = escapeHtml(group.label);
  const items = group.items
    .map((item) => renderNavLink(item, currentPath))
    .join("");

  return `
    <div class="py-2">
      <div class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        ${safeLabel}
      </div>
      <nav class="space-y-1">
        ${items}
      </nav>
    </div>
  `;
};

const renderSidebar = (navigation: NavGroup[], currentPath: string): string =>
  `
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="font-semibold">Markdown Site</span>
      </div>
      <div class="sidebar-content">
        ${navigation
          .map((group) => renderNavGroup(group, currentPath))
          .join("")}
      </div>
    </aside>
  `;

const renderLayoutBody = (props: LayoutProps): string => {
  const {
    title = "Markdown Site",
    content,
    cssPath,
    inlineCss,
    currentPath = "/",
    navigation = [],
    scriptPaths = [],
  } = props;
  const safeTitle = escapeHtml(title);
  const resolvedCssPath = inlineCss ? cssPath : (cssPath ?? "/styles.css");
  const styles = [
    inlineCss ? `<style>${inlineCss}</style>` : "",
    resolvedCssPath
      ? `<link rel="stylesheet" href="${resolvedCssPath}" />`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const scripts = [...DEFAULT_SCRIPT_PATHS, ...scriptPaths]
    .map((scriptPath) => `<script defer src="${scriptPath}"></script>`)
    .join("\n");

  return `
    <html lang="en" class="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${safeTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        ${styles}
      </head>
      <body class="bg-background text-foreground font-mono">
        ${renderSidebar(navigation, currentPath)}
        <div class="main-wrapper">
          <main class="main-content prose">
            ${content}
          </main>
        </div>
        ${scripts}
      </body>
    </html>
  `;
};

export const renderLayout = (props: LayoutProps): string =>
  `<!DOCTYPE html>${renderLayoutBody(props)}`;
