export type DictionarySourcePreference = "cambridge" | "oxford";

export const DICTIONARY_SOURCE_SETTING_KEY = "preferred-dictionary-source";
export const DEFAULT_DICTIONARY_SOURCE: DictionarySourcePreference =
  "cambridge";

export function getDictionarySourcePreference(): DictionarySourcePreference {
  if (typeof window === "undefined") {
    return DEFAULT_DICTIONARY_SOURCE;
  }

  const value = localStorage.getItem(DICTIONARY_SOURCE_SETTING_KEY);
  return value === "cambridge" || value === "oxford"
    ? value
    : DEFAULT_DICTIONARY_SOURCE;
}
