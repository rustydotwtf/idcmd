import { describe, expect, it } from "bun:test";

import { resolveProviderFromFlags } from "@/cli/provider";

describe("provider flags", () => {
  it("defaults to none when no provider flags are set", () => {
    expect(resolveProviderFromFlags({})).toBe("none");
  });

  it("selects vercel when only --vercel is enabled", () => {
    expect(resolveProviderFromFlags({ vercel: true })).toBe("vercel");
  });

  it("throws when multiple provider flags are enabled", () => {
    expect(() =>
      resolveProviderFromFlags({ fly: true, railway: true })
    ).toThrow();
  });
});
