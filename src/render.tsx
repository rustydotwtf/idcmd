import { renderToString } from "react-dom/server";
import { Layout } from "./components/Layout.tsx";

export function render(markdown: string, title?: string): string {
  const content = Bun.markdown.react(markdown);

  const html = renderToString(<Layout title={title}>{content}</Layout>);

  return `<!DOCTYPE html>${html}`;
}
