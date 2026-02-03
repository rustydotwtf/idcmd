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
  currentPath?: string;
  navigation?: NavGroup[];
}

function Icon({ svg }: { svg: string }) {
  return (
    <span
      class="inline-flex w-[18px] h-[18px]"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function NavLink({
  item,
  currentPath,
}: {
  item: NavItem;
  currentPath: string;
}) {
  const isActive =
    currentPath === item.href ||
    (item.href !== "/" && currentPath.startsWith(item.href));
  const activeClass = isActive
    ? "bg-sidebar-accent text-sidebar-accent-foreground"
    : "";

  return (
    <a
      href={item.href}
      class={`flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${activeClass}`}
    >
      <Icon svg={item.iconSvg} />
      <span>{item.title}</span>
    </a>
  );
}

function NavGroupComponent({
  group,
  currentPath,
}: {
  group: NavGroup;
  currentPath: string;
}) {
  return (
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
}

function Layout({
  title = "Markdown Site",
  content,
  cssPath = "/styles.css",
  currentPath = "/",
  navigation = [],
}: LayoutProps) {
  return (
    <html lang="en">
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
        <link rel="stylesheet" href={cssPath} />
      </head>
      <body class="bg-background text-foreground font-mono">
        {/* Sidebar - hidden on mobile */}
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

        {/* Main content */}
        <div class="main-wrapper">
          <main
            class="main-content prose"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </body>
    </html>
  );
}

export function renderLayout(props: LayoutProps): string {
  return "<!DOCTYPE html>" + render(<Layout {...props} />);
}
