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
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                font-family: system-ui, -apple-system, sans-serif;
                line-height: 1.6;
                max-width: 720px;
                margin: 0 auto;
                padding: 2rem;
                color: #1a1a1a;
                background: #fafafa;
              }
              h1, h2, h3 { margin: 1.5rem 0 0.5rem; line-height: 1.3; }
              h1 { font-size: 2rem; }
              h2 { font-size: 1.5rem; }
              h3 { font-size: 1.25rem; }
              p { margin: 1rem 0; }
              a { color: #0066cc; }
              code {
                background: #e8e8e8;
                padding: 0.2em 0.4em;
                border-radius: 3px;
                font-size: 0.9em;
              }
              pre {
                background: #1a1a1a;
                color: #f0f0f0;
                padding: 1rem;
                border-radius: 6px;
                overflow-x: auto;
                margin: 1rem 0;
              }
              pre code { background: none; padding: 0; }
              blockquote {
                border-left: 3px solid #ccc;
                margin: 1rem 0;
                padding-left: 1rem;
                color: #555;
              }
              ul, ol { margin: 1rem 0; padding-left: 1.5rem; }
              li { margin: 0.25rem 0; }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
