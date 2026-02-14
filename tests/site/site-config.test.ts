import { describe, expect, it } from "bun:test";

import { SiteConfigSchema } from "@/site/config";

describe("site-config", () => {
  it("parses and validates JSONC with comments and trailing commas", () => {
    const jsonc = `{
      // comment
      "name": "idcmd",
      "description": "Docs site",
      "baseUrl": "https://example.com",
    }`;

    const raw: unknown = Bun.JSONC.parse(jsonc);

    expect(() => SiteConfigSchema.parse(raw)).not.toThrow();
  });

  it("rejects unknown keys (strict)", () => {
    const raw: unknown = Bun.JSONC.parse(`{
      "name": "idcmd",
      "description": "Docs site",
      "typoKey": true,
    }`);

    expect(() => SiteConfigSchema.parse(raw)).toThrow();
  });

  it("requires baseUrl to be an absolute URL when present", () => {
    const raw: unknown = Bun.JSONC.parse(`{
      "name": "idcmd",
      "description": "Docs site",
      "baseUrl": "example.com",
    }`);

    expect(() => SiteConfigSchema.parse(raw)).toThrow();
  });

  it("validates rightRail.visibleFrom enum values", () => {
    const raw: unknown = Bun.JSONC.parse(`{
      "name": "idcmd",
      "description": "Docs site",
      "rightRail": {
        "visibleFrom": "xs",
      },
    }`);

    expect(() => SiteConfigSchema.parse(raw)).toThrow();
  });

  it("validates tocLevels are 1..6", () => {
    const raw: unknown = Bun.JSONC.parse(`{
      "name": "idcmd",
      "description": "Docs site",
      "rightRail": {
        "tocLevels": [0],
      },
    }`);

    expect(() => SiteConfigSchema.parse(raw)).toThrow();
  });

  it("accepts cache preset and html overrides", () => {
    const raw: unknown = Bun.JSONC.parse(`{
      "name": "idcmd",
      "description": "Docs site",
      "cache": {
        "preset": "balanced",
        "html": {
          "sMaxAgeSeconds": 120,
          "staleWhileRevalidateSeconds": 7200
        }
      }
    }`);

    expect(() => SiteConfigSchema.parse(raw)).not.toThrow();
  });

  it("rejects unknown cache preset values", () => {
    const raw: unknown = Bun.JSONC.parse(`{
      "name": "idcmd",
      "description": "Docs site",
      "cache": {
        "preset": "turbo"
      }
    }`);

    expect(() => SiteConfigSchema.parse(raw)).toThrow();
  });

  it("rejects cache html overrides above max bounds", () => {
    const raw: unknown = Bun.JSONC.parse(`{
      "name": "idcmd",
      "description": "Docs site",
      "cache": {
        "html": {
          "sMaxAgeSeconds": 999999999
        }
      }
    }`);

    expect(() => SiteConfigSchema.parse(raw)).toThrow();
  });
});
