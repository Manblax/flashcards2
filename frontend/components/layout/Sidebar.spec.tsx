import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Sidebar from "./Sidebar";

let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

describe("Sidebar", () => {
  beforeEach(() => {
    pathname = "/";
  });

  it("renders navigation links", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /Главная/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: /Ваша библиотека/i }),
    ).toHaveAttribute("href", "/library");
  });

  it("marks the current route as active", () => {
    pathname = "/library";

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /Ваша библиотека/i })).toHaveClass(
      "bg-neutral/50",
    );
    expect(screen.getByRole("link", { name: /Главная/i })).not.toHaveClass(
      "bg-neutral/50",
    );
  });
});
