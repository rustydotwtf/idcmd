import type { ReactNode } from "react";

interface LayoutProps {
  title?: string;
  children: ReactNode;
}

export function Layout({ title = "Markdown Site", children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
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
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className="bg-background text-foreground font-mono max-w-3xl mx-auto p-8 leading-relaxed">
        <main>{children}</main>
      </body>
    </html>
  );
}
