import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  THEMES,
  applyTheme,
  getStoredTheme,
  isAppTheme,
} from "./theme";

describe("theme utilities", () => {
  it("recognizes supported app themes", () => {
    expect(isAppTheme(THEMES.darkClassic)).toBe(true);
    expect(isAppTheme(THEMES.lightClassic)).toBe(true);
    expect(isAppTheme("unsupported")).toBe(false);
    expect(isAppTheme(null)).toBe(false);
  });

  it("reads a stored theme or falls back to the default", () => {
    expect(getStoredTheme()).toBe(DEFAULT_THEME);

    localStorage.setItem(THEME_STORAGE_KEY, THEMES.light);
    expect(getStoredTheme()).toBe(THEMES.light);

    localStorage.setItem(THEME_STORAGE_KEY, "unsupported");
    expect(getStoredTheme()).toBe(DEFAULT_THEME);
  });

  it("applies the theme to the document and persists it", () => {
    applyTheme(THEMES.dark);

    expect(document.documentElement.dataset.theme).toBe(THEMES.dark);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(THEMES.dark);
  });
});
