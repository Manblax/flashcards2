import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAuthSession,
  getStoredAuthToken,
  syncAuthCookieFromStorage,
} from "@/lib/auth";
import { getAuthTokenExpiration } from "@/lib/auth-token";
import { validateAuthToken } from "@/lib/api";
import AuthSessionSync from "./AuthSessionSync";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

vi.mock("@/lib/auth", () => ({
  AUTH_STATE_CHANGE_EVENT: "auth-state-change",
  clearAuthSession: vi.fn(),
  getStoredAuthToken: vi.fn(),
  syncAuthCookieFromStorage: vi.fn(),
}));

vi.mock("@/lib/auth-token", () => ({
  getAuthTokenExpiration: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  validateAuthToken: vi.fn(),
}));

describe("AuthSessionSync", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.mocked(clearAuthSession).mockReset();
    vi.mocked(getStoredAuthToken).mockReset();
    vi.mocked(getStoredAuthToken).mockReturnValue(null);
    vi.mocked(getAuthTokenExpiration).mockReset();
    vi.mocked(getAuthTokenExpiration).mockReturnValue(null);
    vi.mocked(syncAuthCookieFromStorage).mockReset();
    vi.mocked(validateAuthToken).mockReset();
    vi.mocked(validateAuthToken).mockResolvedValue(null);
  });

  it("refreshes the router when the auth cookie changes", () => {
    vi.mocked(syncAuthCookieFromStorage).mockReturnValue(true);

    render(<AuthSessionSync />);

    expect(refresh).toHaveBeenCalled();
  });

  it("does not refresh when the cookie is already in sync", () => {
    vi.mocked(syncAuthCookieFromStorage).mockReturnValue(false);

    render(<AuthSessionSync />);

    expect(refresh).not.toHaveBeenCalled();
  });

  it("clears and refreshes the session when its token expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T18:00:00Z"));
    const expiration = Date.now() + 1_000;

    vi.mocked(syncAuthCookieFromStorage).mockReturnValue(false);
    vi.mocked(getStoredAuthToken).mockImplementation(() =>
      Date.now() < expiration ? "active-token" : null,
    );
    vi.mocked(getAuthTokenExpiration).mockReturnValue(expiration);

    render(<AuthSessionSync />);
    vi.advanceTimersByTime(1_000);

    expect(clearAuthSession).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalled();
  });

  it("clears a token rejected by the backend", async () => {
    vi.mocked(syncAuthCookieFromStorage).mockReturnValue(false);
    vi.mocked(getStoredAuthToken).mockReturnValue("rejected-token");
    vi.mocked(getAuthTokenExpiration).mockReturnValue(
      Date.now() + 60 * 60 * 1000,
    );
    vi.mocked(validateAuthToken).mockResolvedValue(false);

    render(<AuthSessionSync />);

    await waitFor(() => {
      expect(clearAuthSession).toHaveBeenCalledOnce();
      expect(refresh).toHaveBeenCalled();
    });
  });
});
