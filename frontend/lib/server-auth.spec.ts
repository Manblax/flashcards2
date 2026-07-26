import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestAuthToken } from "@/test/auth-token";

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

describe("getServerAuthToken", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it("returns the token cookie value", async () => {
    const token = createTestAuthToken();
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: token }),
    });
    const { getServerAuthToken } = await import("./server-auth");

    await expect(getServerAuthToken()).resolves.toBe(token);
  });

  it("returns null when the token cookie is missing", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });
    const { getServerAuthToken } = await import("./server-auth");

    await expect(getServerAuthToken()).resolves.toBeNull();
  });

  it("returns null when the token cookie is expired", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: createTestAuthToken(Date.now() - 60_000),
      }),
    });
    const { getServerAuthToken } = await import("./server-auth");

    await expect(getServerAuthToken()).resolves.toBeNull();
  });
});
