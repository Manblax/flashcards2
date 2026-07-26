import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_STATE_CHANGE_EVENT, type AuthUser } from "@/lib/auth";
import UserMenu from "./UserMenu";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

const storedUser: AuthUser = {
  id: "user-1",
  username: "demo",
  email: "demo@example.com",
};

describe("UserMenu", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
  });

  it("renders login and registration links for guests", () => {
    render(<UserMenu />);

    expect(screen.getByRole("link", { name: "Войти" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Регистрация" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("renders stored user details and settings link", async () => {
    localStorage.setItem("user", JSON.stringify(storedUser));

    render(<UserMenu />);

    expect(await screen.findByText("demo")).toBeInTheDocument();
    expect(screen.getByText("demo@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Настройки/i })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("updates when an auth state change event is dispatched", async () => {
    render(<UserMenu />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent<AuthUser>(AUTH_STATE_CHANGE_EVENT, {
          detail: storedUser,
        }),
      );
    });

    expect(await screen.findByText("demo@example.com")).toBeInTheDocument();
  });

  it("clears the session and routes to login on logout", async () => {
    const user = userEvent.setup();
    localStorage.setItem("token", "token-1");
    localStorage.setItem("user", JSON.stringify(storedUser));
    document.cookie = "token=token-1; path=/";

    render(<UserMenu />);

    await user.click(await screen.findByRole("button", { name: /Выйти/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
      expect(push).toHaveBeenCalledWith("/login");
      expect(refresh).toHaveBeenCalled();
    });
  });
});
