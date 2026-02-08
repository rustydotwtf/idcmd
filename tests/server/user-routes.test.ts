import { describe, expect, it } from "bun:test";
import { createTempDir, joinPath, writeTextFile } from "tests/test-utils";

import {
  handleUserRouteRequest,
  routePathnameFromFile,
} from "@/server/user-routes";

describe("user routes", () => {
  it("maps file paths to request pathnames", () => {
    const routesDir = "/tmp/routes";
    expect(routePathnameFromFile("/tmp/routes/api/hello.ts", routesDir)).toBe(
      "/api/hello"
    );
    expect(
      routePathnameFromFile("/tmp/routes/health/index.ts", routesDir)
    ).toBe("/health");
    expect(routePathnameFromFile("/tmp/routes/index.ts", routesDir)).toBe("/");
  });

  it("loads GET handler modules from site/server/routes", async () => {
    const root = await createTempDir("idcmd-routes-");
    const routesDir = joinPath(root, "site", "server", "routes");
    await writeTextFile(
      joinPath(routesDir, "api", "hello.ts"),
      'export const GET = () => new Response("ok");\n'
    );

    const url = new URL("http://localhost/api/hello");
    const req = new Request(url, { method: "GET" });
    const res = await handleUserRouteRequest(url, req, {
      isDev: true,
      routesDir,
    });
    expect(res?.status).toBe(200);
    expect(await res?.text()).toBe("ok");
  });
});
