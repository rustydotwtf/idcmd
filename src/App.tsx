import { Home, Info, FlaskConical, Code, Table, AlertTriangle, Gauge } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface AppProps {
  contentHtml: string;
}

const navItems = [
  { title: "Home", href: "/", icon: Home },
  { title: "About", href: "/about", icon: Info },
];

const testItems = [
  { title: "Basic Markdown", href: "/test-basics", icon: FlaskConical },
  { title: "Code Blocks", href: "/test-code", icon: Code },
  { title: "Tables", href: "/test-tables", icon: Table },
  { title: "Edge Cases", href: "/test-edge-cases", icon: AlertTriangle },
  { title: "Performance", href: "/test-performance", icon: Gauge },
];

export function App({ contentHtml }: AppProps) {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <span className="font-semibold">Markdown Site</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPath === item.href}>
                      <a href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Stress Tests</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {testItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPath === item.href}>
                      <a href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <SidebarTrigger />
        </header>
        <main
          className="flex-1 p-8 prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
