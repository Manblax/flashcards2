import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

describe("getServerAuthToken", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it("returns the token cookie value", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "server-token" }),
    });
    const { getServerAuthToken } = await import("./server-auth");

    await expect(getServerAuthToken()).resolves.toBe("server-token");
  });

  it("returns null when the token cookie is missing", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });
    const { getServerAuthToken } = await import("./server-auth");

    await expect(getServerAuthToken()).resolves.toBeNull();
  });
});
