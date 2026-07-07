import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Module } from "@/types/module";
import ModuleCard from "./ModuleCard";

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    id: "module-1",
    title: "English Verbs",
    description: "Practice set",
    termCount: 1,
    author: "alice",
    createdAt: new Date("2026-07-01T10:00:00Z"),
    updatedAt: new Date("2026-07-01T10:00:00Z"),
    ...overrides,
  };
}

describe("ModuleCard", () => {
  it("links to the module details page and renders module metadata", () => {
    render(<ModuleCard module={makeModule()} />);

    expect(screen.getByRole("link", { name: /English Verbs/i })).toHaveAttribute(
      "href",
      "/module/module-1",
    );
    expect(screen.getByText("1 термин")).toBeInTheDocument();
    expect(screen.getByText("Автор: alice")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it.each([
    [2, "2 термина"],
    [5, "5 терминов"],
    [11, "11 терминов"],
    [21, "21 термин"],
  ])("renders Russian term pluralization for %i", (termCount, label) => {
    render(<ModuleCard module={makeModule({ termCount })} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
