import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ModuleStudyModes from "./ModuleStudyModes";

describe("ModuleStudyModes", () => {
  it("places the write link immediately after the test button", () => {
    const { container } = render(<ModuleStudyModes moduleId="module-1" />);
    const controls = Array.from(container.querySelectorAll("button, a"));

    expect(controls.map((control) => control.textContent?.trim())).toEqual([
      "Карточки",
      "Заучивание",
      "Тест",
      "write",
    ]);
    expect(screen.getByRole("link", { name: "write" })).toHaveAttribute(
      "href",
      "/module/module-1/write",
    );
  });
});
