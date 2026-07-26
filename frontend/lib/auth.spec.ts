import { describe, expect, it, vi } from "vitest";

import {
  AUTH_STATE_CHANGE_EVENT,
  AuthUser,
  clearAuthSession,
  getStoredUser,
  persistAuthSession,
  syncAuthCookieFromStorage,
} from "./auth";
import { createTestAuthToken } from "@/test/auth-token";

const user: AuthUser = {
  id: "user-1",
  username: "demo",
  email: "demo@example.com",
};

describe("auth session utilities", () => {
  it("persists token, user, cookie, and emits an auth event", () => {
    const listener = vi.fn();
    const token = createTestAuthToken();
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, listener);

    persistAuthSession(token, user);

    expect(localStorage.getItem("token")).toBe(token);
    expect(getStoredUser()).toEqual(user);
    expect(document.cookie).toContain(`token=${token}`);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0]).toMatchObject({ detail: user });
  });

  it("clears token, user, cookie, and emits an auth event", () => {
    const listener = vi.fn();
    persistAuthSession(createTestAuthToken(), user);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, listener);

    clearAuthSession();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(document.cookie).not.toContain("token=");
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0]).toMatchObject({ detail: null });
  });

  it("removes invalid stored user data", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("token", createTestAuthToken());
    localStorage.setItem("user", "{invalid");

    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("syncs the auth cookie from local storage", () => {
    const token = createTestAuthToken();
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    expect(syncAuthCookieFromStorage()).toBe(true);
    expect(document.cookie).toContain(`token=${token}`);
    expect(syncAuthCookieFromStorage()).toBe(false);
  });

  it("clears a stale auth cookie when local storage has no token", () => {
    persistAuthSession(createTestAuthToken(), user);
    localStorage.removeItem("token");

    expect(syncAuthCookieFromStorage()).toBe(true);
    expect(document.cookie).not.toContain("token=");
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("clears an expired session instead of restoring its cookie", () => {
    const expiredToken = createTestAuthToken(Date.now() - 60_000);
    localStorage.setItem("token", expiredToken);
    localStorage.setItem("user", JSON.stringify(user));
    document.cookie = `token=${expiredToken}; path=/`;

    expect(syncAuthCookieFromStorage()).toBe(true);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(document.cookie).not.toContain("token=");
  });

  it("does not treat stored user details without a token as a session", () => {
    localStorage.setItem("user", JSON.stringify(user));

    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
