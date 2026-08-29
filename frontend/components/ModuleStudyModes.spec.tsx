import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ModuleStudyModes from "./ModuleStudyModes";

describe("ModuleStudyModes", () => {
  it("places the spell link immediately after write", () => {
    const { container } = render(<ModuleStudyModes moduleId="module-1" />);
    const controls = Array.from(container.querySelectorAll("button, a"));

    expect(controls.map((control) => control.textContent?.trim())).toEqual([
      "card",
      "learn",
      "test",
      "write",
      "spell",
    ]);
    expect(screen.getByRole("link", { name: "card" })).toHaveAttribute(
      "href",
      "/module/module-1/card",
    );
    expect(screen.getByRole("link", { name: "learn" })).toHaveAttribute(
      "href",
      "/module/module-1/learn",
    );
    expect(screen.getByRole("link", { name: "test" })).toHaveAttribute(
      "href",
      "/module/module-1/test",
    );
    expect(screen.getByRole("link", { name: "write" })).toHaveAttribute(
      "href",
      "/module/module-1/write",
    );
    expect(screen.getByRole("link", { name: "spell" })).toHaveAttribute(
      "href",
      "/module/module-1/spell",
    );
  });
});
