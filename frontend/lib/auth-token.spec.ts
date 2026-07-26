import { describe, expect, it } from "vitest";

import {
  getAuthTokenExpiration,
  isAuthTokenActive,
} from "./auth-token";
import { createTestAuthToken } from "@/test/auth-token";

describe("auth token utilities", () => {
  it("reads the expiration from an active JWT", () => {
    const now = 1_800_000_000_000;
    const expiresAt = now + 60_000;
    const token = createTestAuthToken(expiresAt);

    expect(getAuthTokenExpiration(token)).toBe(
      Math.floor(expiresAt / 1000) * 1000,
    );
    expect(isAuthTokenActive(token, now)).toBe(true);
  });

  it("rejects expired JWTs", () => {
    const now = 1_800_000_000_000;
    const token = createTestAuthToken(now - 1_000);

    expect(isAuthTokenActive(token, now)).toBe(false);
  });

  it("rejects malformed tokens and JWTs without an expiration", () => {
    const withoutExpiration = [
      Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url"),
      Buffer.from(JSON.stringify({ sub: "user-1" })).toString("base64url"),
      "test-signature",
    ].join(".");

    expect(isAuthTokenActive("not-a-jwt")).toBe(false);
    expect(isAuthTokenActive(withoutExpiration)).toBe(false);
  });
});
