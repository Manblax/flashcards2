import { describe, expect, it } from "vitest";

import {
  DEFAULT_PRONUNCIATION_VARIANT,
  getAlternatePronunciationVariant,
  getPronunciationVariantPreference,
  PRONUNCIATION_SETTING_KEY,
} from "./pronunciation-settings";

describe("pronunciation settings", () => {
  it("defaults to UK and reads supported stored variants", () => {
    expect(getPronunciationVariantPreference()).toBe(
      DEFAULT_PRONUNCIATION_VARIANT,
    );

    localStorage.setItem(PRONUNCIATION_SETTING_KEY, "us");
    expect(getPronunciationVariantPreference()).toBe("us");

    localStorage.setItem(PRONUNCIATION_SETTING_KEY, "unsupported");
    expect(getPronunciationVariantPreference()).toBe("uk");
  });

  it("returns the alternate audio variant", () => {
    expect(getAlternatePronunciationVariant("uk")).toBe("us");
    expect(getAlternatePronunciationVariant("us")).toBe("uk");
  });
});
