import { render } from "preact-render-to-string";
import type { JSX } from "preact";

interface LayoutProps {
  title?: string;
  content: string;
  cssPath?: string;
  currentPath?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { title: "Home", href: "/", icon: "home" },
  { title: "About", href: "/about", icon: "info" },
];

const testItems: NavItem[] = [
  { title: "Basic Markdown", href: "/test-basics", icon: "flask" },
  { title: "Code Blocks", href: "/test-code", icon: "code" },
  { title: "Tables", href: "/test-tables", icon: "table" },
  { title: "Edge Cases", href: "/test-edge-cases", icon: "warning" },
  { title: "Performance", href: "/test-performance", icon: "gauge" },
];

// SVG Icons as components
function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 3v18" />
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}

function Icon({ name }: { name: string }): JSX.Element | null {
  switch (name) {
    case "home":
      return <HomeIcon />;
    case "info":
      return <InfoIcon />;
    case "flask":
      return <FlaskIcon />;
    case "code":
      return <CodeIcon />;
    case "table":
      return <TableIcon />;
    case "warning":
      return <WarningIcon />;
    case "gauge":
      return <GaugeIcon />;
    default:
      return null;
  }
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
      <Icon name={item.icon} />
      <span>{item.title}</span>
    </a>
  );
}

function NavGroup({
  label,
  items,
  currentPath,
}: {
  label: string;
  items: NavItem[];
  currentPath: string;
}) {
  return (
    <div class="py-2">
      <div class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <nav class="space-y-1">
        {items.map((item) => (
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
            <NavGroup
              label="Navigation"
              items={navItems}
              currentPath={currentPath}
            />
            <NavGroup
              label="Stress Tests"
              items={testItems}
              currentPath={currentPath}
            />
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
