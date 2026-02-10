import type { Server } from "bun";

import { getContentDir, scanContentFiles } from "../content/paths";

interface LiveReloadClient {
  close: () => void;
  send: (msg: string) => void;
}

type ServerInstance = Server<undefined>;

export interface LiveReloadEnv {
  isDev: boolean;
  pollMs: number;
  websocketPath: string;
}

export interface LiveReloadController {
  maybeHandleUpgrade: (
    req: Request,
    server: ServerInstance,
    pathname: string
  ) => "handled" | Response | undefined;
  startWatcher: () => Promise<void>;
  websocket: {
    close: (ws: LiveReloadClient) => void;
    message: () => void;
    open: (ws: LiveReloadClient) => void;
  };
}

export const createLiveReload = (env: LiveReloadEnv): LiveReloadController => {
  const clients = new Set<LiveReloadClient>();

  const notify = (message: string): void => {
    for (const client of clients) {
      try {
        client.send(message);
      } catch {
        clients.delete(client);
      }
    }
  };

  const getContentSnapshot = async (): Promise<string> => {
    const contentDir = await getContentDir();
    const entries: string[] = [];
    for await (const file of scanContentFiles()) {
      const filePath = `${contentDir}/${file}`;
      const { lastModified } = Bun.file(filePath);
      entries.push(`${file}:${lastModified}`);
    }

    return entries.toSorted().join("|");
  };

  const startWatcher = async (): Promise<void> => {
    if (!env.isDev) {
      return;
    }

    console.log("Watching content/ for changes...");
    let snapshot = await getContentSnapshot();

    const poll = async (): Promise<void> => {
      const nextSnapshot = await getContentSnapshot();
      if (nextSnapshot !== snapshot) {
        snapshot = nextSnapshot;
        console.log("[live-reload] Content updated");
        notify("reload");
      }
    };

    setInterval(async () => {
      try {
        await poll();
      } catch (error) {
        console.warn("[live-reload] Polling error", error);
      }
    }, env.pollMs);
  };

  const maybeHandleUpgrade = (
    req: Request,
    server: ServerInstance,
    pathname: string
  ): "handled" | Response | undefined => {
    // Backward compatible: accept both legacy and new websocket paths.
    if (
      !env.isDev ||
      (pathname !== env.websocketPath && pathname !== "/__live-reload")
    ) {
      return undefined;
    }

    const upgraded = server.upgrade(req);
    if (upgraded) {
      return "handled";
    }

    return new Response("WebSocket upgrade failed", { status: 400 });
  };

  return {
    maybeHandleUpgrade,
    startWatcher,
    websocket: {
      close(ws) {
        clients.delete(ws);
        console.log("[live-reload] Client disconnected");
      },
      message() {
        // No messages expected from client.
      },
      open(ws) {
        clients.add(ws);
        console.log("[live-reload] Client connected");
      },
    },
  };
};
