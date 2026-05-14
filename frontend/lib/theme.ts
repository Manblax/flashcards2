export const THEME_STORAGE_KEY = "preferred-theme";

export const THEMES = {
  darkClassic: "dark-classic",
  lightClassic: "light-classic",
  light: "light",
  dark: "dark",
} as const;

export type AppTheme = (typeof THEMES)[keyof typeof THEMES];

export const DEFAULT_THEME: AppTheme = THEMES.darkClassic;

export function isAppTheme(value: string | null): value is AppTheme {
  return (
    value === THEMES.darkClassic ||
    value === THEMES.lightClassic ||
    value === THEMES.light ||
    value === THEMES.dark
  );
}

export function getStoredTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  return isAppTheme(storedTheme) ? storedTheme : DEFAULT_THEME;
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
