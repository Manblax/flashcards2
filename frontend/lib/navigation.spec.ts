import { describe, expect, it } from "vitest";

import { resolveSafeRedirect } from "./navigation";

describe("resolveSafeRedirect", () => {
  it("keeps relative application paths", () => {
    expect(resolveSafeRedirect("/library")).toBe("/library");
    expect(resolveSafeRedirect("/module/123?mode=edit")).toBe(
      "/module/123?mode=edit",
    );
  });

  it("falls back for missing or external redirects", () => {
    expect(resolveSafeRedirect(null)).toBe("/");
    expect(resolveSafeRedirect("https://example.com")).toBe("/");
    expect(resolveSafeRedirect("//example.com/path")).toBe("/");
  });

  it("uses the provided fallback", () => {
    expect(resolveSafeRedirect("login", "/login")).toBe("/login");
  });
});
