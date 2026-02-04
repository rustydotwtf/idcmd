import type { JSX } from "preact";

import { render } from "preact-render-to-string";

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

const DEFAULT_SCRIPT_PATHS = ["/nav-prefetch.js"] as const;

const Icon = ({ svg }: { svg: string }): JSX.Element => (
  <span
    class="inline-flex w-[18px] h-[18px]"
    dangerouslySetInnerHTML={{ __html: svg }}
  />
);

const isActiveLink = (item: NavItem, currentPath: string): boolean =>
  currentPath === item.href ||
  (item.href !== "/" && currentPath.startsWith(item.href));

const NavLink = ({
  item,
  currentPath,
}: {
  item: NavItem;
  currentPath: string;
}): JSX.Element => {
  const activeClass = isActiveLink(item, currentPath)
    ? "bg-sidebar-accent text-sidebar-accent-foreground"
    : "";

  return (
    <a
      href={item.href}
      data-prefetch="hover"
      class={`flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${activeClass}`}
    >
      <Icon svg={item.iconSvg} />
      <span>{item.title}</span>
    </a>
  );
};

const NavGroupComponent = ({
  group,
  currentPath,
}: {
  group: NavGroup;
  currentPath: string;
}): JSX.Element => (
  <div class="py-2">
    <div class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {group.label}
    </div>
    <nav class="space-y-1">
      {group.items.map((item) => (
        <NavLink key={item.href} item={item} currentPath={currentPath} />
      ))}
    </nav>
  </div>
);

const Sidebar = ({
  navigation,
  currentPath,
}: {
  navigation: NavGroup[];
  currentPath: string;
}): JSX.Element => (
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="font-semibold">Markdown Site</span>
    </div>
    <div class="sidebar-content">
      {navigation.map((group) => (
        <NavGroupComponent
          key={group.id}
          group={group}
          currentPath={currentPath}
        />
      ))}
    </div>
  </aside>
);

const Layout = ({
  title = "Markdown Site",
  content,
  cssPath,
  inlineCss,
  currentPath = "/",
  navigation = [],
  scriptPaths = [],
}: LayoutProps): JSX.Element => {
  const resolvedCssPath = inlineCss ? cssPath : (cssPath ?? "/styles.css");
  const mergedScriptPaths = [...DEFAULT_SCRIPT_PATHS, ...scriptPaths];

  return (
    <html lang="en" class="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {inlineCss ? <style>{inlineCss}</style> : null}
        {resolvedCssPath ? (
          <link rel="stylesheet" href={resolvedCssPath} />
        ) : null}
      </head>
      <body class="bg-background text-foreground font-mono">
        <Sidebar navigation={navigation} currentPath={currentPath} />
        <div class="main-wrapper">
          <main
            class="main-content prose"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
        {mergedScriptPaths.map((scriptPath) => (
          <script key={scriptPath} defer src={scriptPath} />
        ))}
      </body>
    </html>
  );
};

export const renderLayout = (props: LayoutProps): string =>
  `<!DOCTYPE html>${render(<Layout {...props} />)}`;
