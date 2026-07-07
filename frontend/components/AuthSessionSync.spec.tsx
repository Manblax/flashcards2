import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { syncAuthCookieFromStorage } from "@/lib/auth";
import AuthSessionSync from "./AuthSessionSync";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

vi.mock("@/lib/auth", () => ({
  syncAuthCookieFromStorage: vi.fn(),
}));

describe("AuthSessionSync", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.mocked(syncAuthCookieFromStorage).mockReset();
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
});
