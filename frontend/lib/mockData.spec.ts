import { describe, expect, it, vi } from "vitest";

import { generateMockModules } from "./mockData";

describe("generateMockModules", () => {
  it("returns the requested number of modules", () => {
    vi.setSystemTime(new Date("2026-07-08T12:00:00Z"));

    const modules = generateMockModules(3);

    expect(modules).toHaveLength(3);
    expect(modules.map((module) => module.id)).toEqual([
      "module-1",
      "module-2",
      "module-3",
    ]);
  });

  it("uses curated lesson names and sample terms for initial modules", () => {
    vi.setSystemTime(new Date("2026-07-08T12:00:00Z"));

    const [firstModule] = generateMockModules(1);

    expect(firstModule).toMatchObject({
      title: "Lesson 443 - 445",
      termCount: 12,
      author: "manblax",
    });
    expect(firstModule.terms).toHaveLength(8);
    expect(firstModule.terms?.[0]).toMatchObject({
      id: "t1",
      term: "mashed potato",
      isFavorite: true,
    });
  });

  it("spaces generated modules two days apart", () => {
    vi.setSystemTime(new Date("2026-07-08T12:00:00Z"));

    const modules = generateMockModules(4);

    expect(modules.map((module) => module.createdAt.toISOString())).toEqual([
      "2026-07-08T12:00:00.000Z",
      "2026-07-06T12:00:00.000Z",
      "2026-07-04T12:00:00.000Z",
      "2026-07-02T12:00:00.000Z",
    ]);
  });

  it("generates fallback lesson titles after curated lessons", () => {
    vi.setSystemTime(new Date("2026-07-08T12:00:00Z"));
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const modules = generateMockModules(12);
    const fallbackModule = modules[11];

    expect(fallbackModule).toMatchObject({
      id: "module-12",
      title: "Lesson 429",
      termCount: 23,
      author: "manblax",
    });
  });
});
