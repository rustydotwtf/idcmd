import { renderToString } from "react-dom/server";
import { Layout } from "./components/Layout.tsx";

const liveReloadScript = `
<script>
(function() {
  const ws = new WebSocket('ws://' + location.host + '/__live-reload');
  ws.onmessage = function(e) {
    if (e.data === 'reload') {
      console.log('[live-reload] Reloading...');
      location.reload();
    }
  };
  ws.onclose = function() {
    console.log('[live-reload] Disconnected, attempting reconnect...');
    setTimeout(function() { location.reload(); }, 1000);
  };
})();
</script>
`;

export function render(markdown: string, title?: string, isDev = false): string {
  const content = Bun.markdown.react(markdown);

  const html = renderToString(<Layout title={title}>{content}</Layout>);

  const devScript = isDev ? liveReloadScript : "";
  
  return `<!DOCTYPE html>${html}${devScript}`;
}
