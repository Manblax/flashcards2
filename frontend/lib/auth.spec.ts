import { describe, expect, it, vi } from "vitest";

import {
  AUTH_STATE_CHANGE_EVENT,
  AuthUser,
  clearAuthSession,
  getStoredUser,
  persistAuthSession,
  syncAuthCookieFromStorage,
} from "./auth";

const user: AuthUser = {
  id: "user-1",
  username: "demo",
  email: "demo@example.com",
};

describe("auth session utilities", () => {
  it("persists token, user, cookie, and emits an auth event", () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, listener);

    persistAuthSession("token-1", user);

    expect(localStorage.getItem("token")).toBe("token-1");
    expect(getStoredUser()).toEqual(user);
    expect(document.cookie).toContain("token=token-1");
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0]).toMatchObject({ detail: user });
  });

  it("clears token, user, cookie, and emits an auth event", () => {
    const listener = vi.fn();
    persistAuthSession("token-1", user);
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
    localStorage.setItem("user", "{invalid");

    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("syncs the auth cookie from local storage", () => {
    localStorage.setItem("token", "stored-token");

    expect(syncAuthCookieFromStorage()).toBe(true);
    expect(document.cookie).toContain("token=stored-token");
    expect(syncAuthCookieFromStorage()).toBe(false);
  });

  it("clears a stale auth cookie when local storage has no token", () => {
    persistAuthSession("stale-token", user);
    localStorage.removeItem("token");

    expect(syncAuthCookieFromStorage()).toBe(true);
    expect(document.cookie).not.toContain("token=");
  });
});
