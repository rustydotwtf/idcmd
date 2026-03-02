/* eslint-disable react/jsx-key */

import type { LayoutProps } from "idcmd/client";

import { RightRail } from "./right-rail";

type NavItem = LayoutProps["navigation"][number]["items"][number];

const escapeText = (value: string): string => Bun.escapeHTML(value);

const Icon = ({ svg }: { svg: string }): JSX.Element => (
  <span class="inline-flex h-[18px] w-[18px]">{svg}</span>
);

const isActiveLink = (item: NavItem, currentPath: string): boolean =>
  currentPath === item.href ||
  (item.href !== "/" && currentPath.startsWith(item.href));

const Sidebar = ({
  siteName,
  navigation,
  currentPath,
}: {
  siteName: LayoutProps["siteName"];
  navigation: LayoutProps["navigation"];
  currentPath: LayoutProps["currentPath"];
}): JSX.Element => (
  <aside class="sidebar">
    <div class="sidebar-header">
      <a
        href="/"
        class="text-sm font-medium tracking-tight"
        data-prefetch="hover"
      >
        <span class="text-muted-foreground">~/</span>
        {escapeText(siteName)}
      </a>
    </div>
    <div class="sidebar-content">
      {navigation.map((group) => (
        <div class="py-2">
          <p class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {escapeText(group.label)}
          </p>
          <nav class="space-y-1">
            {group.items.map((item) => (
              <a
                href={item.href}
                data-prefetch="hover"
                class={`flex items-center gap-3 px-3 py-1.5 text-sm transition-colors hover:text-sidebar-foreground ${
                  isActiveLink(item, currentPath)
                    ? "border-l-2 border-sidebar-primary font-medium text-sidebar-foreground"
                    : "border-l-2 border-transparent"
                }`}
              >
                <Icon svg={item.iconSvg} />
                <span>{escapeText(item.title)}</span>
              </a>
            ))}
          </nav>
        </div>
      ))}
    </div>
  </aside>
);

const buildHtmlClass = (
  smoothScroll: LayoutProps["rightRail"]["smoothScroll"]
): string => (smoothScroll ? "dark smooth-scroll" : "dark");

const buildScrollSpyDataset = (props: {
  isScrollSpyEnabled: boolean;
  rightRail: LayoutProps["rightRail"];
}): {
  scrollspy?: string;
  scrollspyCenter?: string;
  scrollspyUpdateHash?: string;
} =>
  props.isScrollSpyEnabled
    ? {
        scrollspy: "1",
        scrollspyCenter: props.rightRail.scrollSpy.centerActiveItem
          ? "1"
          : undefined,
        scrollspyUpdateHash: props.rightRail.scrollSpy.updateHash,
      }
    : {};

const Layout = ({
  title,
  siteName,
  description,
  canonicalUrl,
  content,
  cssPath,
  inlineCss,
  currentPath,
  navigation,
  scriptPaths = [],
  showRightRail = true,
  rightRail,
  tocItems,
}: LayoutProps): JSX.Element => {
  const resolvedCssPath = inlineCss ? undefined : (cssPath ?? "/styles.css");
  const shouldShowRightRail = showRightRail && rightRail.enabled;
  const isScrollSpyEnabled =
    shouldShowRightRail && rightRail.scrollSpy.enabled && tocItems.length > 0;
  const scrollSpyDataset = buildScrollSpyDataset({
    isScrollSpyEnabled,
    rightRail,
  });

  return (
    <html lang="en" class={buildHtmlClass(rightRail.smoothScroll)}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{escapeText(title)}</title>
        {description ? (
          <meta name="description" content={escapeText(description)} />
        ) : null}
        {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {inlineCss ? <style>{inlineCss}</style> : null}
        {resolvedCssPath ? (
          <link rel="stylesheet" href={resolvedCssPath} />
        ) : null}
      </head>
      <body
        class="bg-background font-sans text-foreground"
        data-scrollspy={scrollSpyDataset.scrollspy}
        data-scrollspy-center={scrollSpyDataset.scrollspyCenter}
        data-scrollspy-update-hash={scrollSpyDataset.scrollspyUpdateHash}
      >
        <Sidebar
          siteName={siteName}
          navigation={navigation}
          currentPath={currentPath}
        />
        <div class="main-wrapper">
          <main class="main-content">
            <div class="mx-auto flex w-full max-w-6xl items-start gap-10">
              <article
                class={`prose min-w-0 flex-1${
                  currentPath === "/" ? " prose-home" : ""
                }`}
              >
                {/* content is pre-rendered markdown HTML */}
                {content}
              </article>
              {shouldShowRightRail ? (
                <RightRail
                  canonicalUrl={canonicalUrl}
                  currentPath={currentPath}
                  tocItems={tocItems}
                  rightRailConfig={rightRail}
                />
              ) : null}
            </div>
          </main>
          <footer class="site-footer">
            Built with idcmd SSR + Tailwind &nbsp;|&nbsp; Zero JavaScript on
            content pages
          </footer>
        </div>
        {scriptPaths.map((scriptPath) => (
          <script defer src={scriptPath} />
        ))}
      </body>
    </html>
  );
};

export const renderLayout = (props: LayoutProps): string =>
  `<!DOCTYPE html>${<Layout {...props} />}`;
