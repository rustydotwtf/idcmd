/* eslint-disable react/no-danger */
import type { JSX } from "preact";

import { render } from "preact-render-to-string";

import type { NavGroup, NavItem } from "../content/navigation";
import type { ResolvedRightRailConfig } from "../site/config";
import type { RightRailComponent } from "./right-rail";
import type { TocItem } from "./toc";

import { RightRail } from "./right-rail";

export interface LayoutProps {
  title: string;
  siteName: string;
  description?: string;
  canonicalUrl?: string;
  content: string;
  cssPath?: string;
  inlineCss?: string;
  currentPath: string;
  navigation: NavGroup[];
  scriptPaths?: string[];
  searchQuery?: string;
  showRightRail?: boolean;
  rightRailComponent?: RightRailComponent;
  rightRail: ResolvedRightRailConfig;
  tocItems: TocItem[];
}

export type RenderLayout = (props: LayoutProps) => string;

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
    ? "border-l-2 border-sidebar-primary font-medium text-sidebar-foreground"
    : "border-l-2 border-transparent";

  return (
    <a
      href={item.href}
      data-prefetch="hover"
      class={`flex items-center gap-3 px-3 py-1.5 text-sm hover:text-sidebar-foreground transition-colors ${activeClass}`}
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
  siteName,
  navigation,
  currentPath,
}: {
  siteName: string;
  navigation: NavGroup[];
  currentPath: string;
}): JSX.Element => (
  <aside class="sidebar">
    <div class="sidebar-header">
      <a
        href="/"
        class="text-sm font-medium tracking-tight"
        data-prefetch="hover"
      >
        <span class="text-muted-foreground">~/</span>
        {siteName}
      </a>
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

const SearchForm = ({ query }: { query?: string }): JSX.Element => (
  <form
    method="get"
    action="/search/"
    class="flex w-full items-center"
    role="search"
    noValidate
  >
    <label htmlFor="site-search" class="sr-only">
      Search pages
    </label>
    <input
      id="site-search"
      name="q"
      type="search"
      autoComplete="off"
      spellcheck={false}
      placeholder="Search..."
      defaultValue={query ?? ""}
      class="w-full border-b border-input bg-transparent px-1 py-1.5 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
    />
  </form>
);

const TopNavbar = ({
  query,
  siteName,
}: {
  query?: string;
  siteName: string;
}): JSX.Element => (
  <header class="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
    <div class="mx-auto max-w-6xl px-8 py-3">
      <div class="flex items-center gap-4">
        <a
          href="/"
          class="text-sm font-medium tracking-tight font-mono lg:hidden"
          data-prefetch="hover"
        >
          <span class="text-muted-foreground">~/</span>
          {siteName}
        </a>
        <div class="not-prose w-full max-w-xs ml-auto">
          <SearchForm query={query} />
        </div>
      </div>
    </div>
  </header>
);

interface DocumentHeadProps {
  canonicalUrl?: string;
  description?: string;
  inlineCss?: string;
  resolvedCssPath?: string;
  title: string;
}

const DocumentHead = ({
  canonicalUrl,
  description,
  inlineCss,
  resolvedCssPath,
  title,
}: DocumentHeadProps): JSX.Element => (
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description ? <meta name="description" content={description} /> : null}
    {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossOrigin="anonymous"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
      rel="stylesheet"
    />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    {inlineCss ? <style>{inlineCss}</style> : null}
    {resolvedCssPath ? <link rel="stylesheet" href={resolvedCssPath} /> : null}
  </head>
);

const buildHtmlClass = (smoothScroll: boolean): string =>
  smoothScroll ? "dark smooth-scroll" : "dark";

interface ScrollSpyDataset {
  scrollspy?: string;
  scrollspyCenter?: string;
  scrollspyUpdateHash?: string;
}

const buildScrollSpyDataset = (
  isScrollSpyEnabled: boolean,
  rightRail: ResolvedRightRailConfig
): ScrollSpyDataset =>
  isScrollSpyEnabled
    ? {
        scrollspy: "1",
        scrollspyCenter: rightRail.scrollSpy.centerActiveItem ? "1" : undefined,
        scrollspyUpdateHash: rightRail.scrollSpy.updateHash,
      }
    : {};

interface DocumentBodyProps {
  canonicalUrl?: string;
  content: string;
  currentPath: string;
  navigation: NavGroup[];
  rightRail: ResolvedRightRailConfig;
  scriptPaths: string[];
  scrollSpyDataset: ScrollSpyDataset;
  searchQuery?: string;
  shouldShowRightRail: boolean;
  siteName: string;
  tocItems: TocItem[];
  rightRailComponent: RightRailComponent;
}

const DocumentBody = ({
  canonicalUrl,
  content,
  currentPath,
  navigation,
  rightRail,
  scriptPaths,
  scrollSpyDataset,
  searchQuery,
  shouldShowRightRail,
  siteName,
  tocItems,
  rightRailComponent: RightRailComponent,
}: DocumentBodyProps): JSX.Element => (
  <body
    class="bg-background text-foreground font-sans"
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
      <TopNavbar query={searchQuery} siteName={siteName} />
      <main class="main-content">
        <div class="mx-auto flex w-full max-w-6xl items-start gap-10">
          <article
            class={`prose min-w-0 flex-1${currentPath === "/" ? " prose-home" : ""}`}
            dangerouslySetInnerHTML={{ __html: content }}
          />
          {shouldShowRightRail ? (
            <RightRailComponent
              canonicalUrl={canonicalUrl}
              currentPath={currentPath}
              tocItems={tocItems}
              rightRailConfig={rightRail}
            />
          ) : null}
        </div>
      </main>
      <footer class="site-footer">
        Built with Preact SSR + Tailwind &nbsp;|&nbsp; Zero JavaScript on
        content pages
      </footer>
    </div>
    {scriptPaths.map((scriptPath) => (
      <script key={scriptPath} defer src={scriptPath} />
    ))}
  </body>
);

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
  searchQuery,
  showRightRail = true,
  rightRailComponent = RightRail,
  rightRail,
  tocItems,
}: LayoutProps): JSX.Element => {
  const resolvedCssPath = inlineCss ? undefined : (cssPath ?? "/styles.css");
  const shouldShowRightRail = showRightRail && rightRail.enabled;
  const isScrollSpyEnabled =
    shouldShowRightRail && rightRail.scrollSpy.enabled && tocItems.length > 0;
  const htmlClass = buildHtmlClass(rightRail.smoothScroll);
  const scrollSpyDataset = buildScrollSpyDataset(isScrollSpyEnabled, rightRail);

  return (
    <html lang="en" class={htmlClass}>
      <DocumentHead
        canonicalUrl={canonicalUrl}
        description={description}
        inlineCss={inlineCss}
        resolvedCssPath={resolvedCssPath}
        title={title}
      />
      <DocumentBody
        canonicalUrl={canonicalUrl}
        content={content}
        currentPath={currentPath}
        navigation={navigation}
        rightRail={rightRail}
        scriptPaths={scriptPaths}
        scrollSpyDataset={scrollSpyDataset}
        searchQuery={searchQuery}
        shouldShowRightRail={shouldShowRightRail}
        siteName={siteName}
        tocItems={tocItems}
        rightRailComponent={rightRailComponent}
      />
    </html>
  );
};

export const renderLayout: RenderLayout = (props) =>
  `<!DOCTYPE html>${render(<Layout {...props} />)}`;
