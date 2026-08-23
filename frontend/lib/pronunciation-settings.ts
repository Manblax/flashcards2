export type PronunciationVariant = "uk" | "us";

export const PRONUNCIATION_SETTING_KEY =
  "preferred-pronunciation-variant";
export const DEFAULT_PRONUNCIATION_VARIANT: PronunciationVariant = "uk";

export function getPronunciationVariantPreference(): PronunciationVariant {
  if (typeof window === "undefined") {
    return DEFAULT_PRONUNCIATION_VARIANT;
  }

  const value = localStorage.getItem(PRONUNCIATION_SETTING_KEY);
  return value === "uk" || value === "us"
    ? value
    : DEFAULT_PRONUNCIATION_VARIANT;
}

export function getAlternatePronunciationVariant(
  variant: PronunciationVariant,
): PronunciationVariant {
  return variant === "uk" ? "us" : "uk";
}
