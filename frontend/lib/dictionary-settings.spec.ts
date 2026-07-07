import { describe, expect, it } from "vitest";

import {
  DEFAULT_DICTIONARY_SOURCE,
  DICTIONARY_SOURCE_SETTING_KEY,
  getDictionarySourcePreference,
} from "./dictionary-settings";

describe("getDictionarySourcePreference", () => {
  it("returns the default when no preference is stored", () => {
    expect(getDictionarySourcePreference()).toBe(DEFAULT_DICTIONARY_SOURCE);
  });

  it("returns a stored supported source", () => {
    localStorage.setItem(DICTIONARY_SOURCE_SETTING_KEY, "oxford");
    expect(getDictionarySourcePreference()).toBe("oxford");

    localStorage.setItem(DICTIONARY_SOURCE_SETTING_KEY, "cambridge");
    expect(getDictionarySourcePreference()).toBe("cambridge");
  });

  it("ignores unsupported stored values", () => {
    localStorage.setItem(DICTIONARY_SOURCE_SETTING_KEY, "unknown");
    expect(getDictionarySourcePreference()).toBe(DEFAULT_DICTIONARY_SOURCE);
  });
});
