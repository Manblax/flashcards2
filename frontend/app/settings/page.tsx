"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_STATE_CHANGE_EVENT,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";
import {
  applyTheme,
  getStoredTheme,
  THEMES,
  type AppTheme,
} from "@/lib/theme";
import {
  DICTIONARY_SOURCE_SETTING_KEY,
  getDictionarySourcePreference,
  type DictionarySourcePreference,
} from "@/lib/dictionary-settings";
import {
  getPronunciationVariantPreference,
  PRONUNCIATION_SETTING_KEY,
  type PronunciationVariant,
} from "@/lib/pronunciation-settings";

interface SavedSettings {
  theme: AppTheme;
  pronunciationVariant: PronunciationVariant;
  dictionarySource: DictionarySourcePreference;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [pronunciationVariant, setPronunciationVariant] =
    useState<PronunciationVariant>("uk");
  const [theme, setTheme] = useState<AppTheme>(THEMES.darkClassic);
  const [dictionarySource, setDictionarySource] =
    useState<DictionarySourcePreference>("cambridge");
  const [savedSettings, setSavedSettings] = useState<SavedSettings | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      const storedUser = getStoredUser();
      setUser(storedUser);
      setHasCheckedAuth(true);

      if (!storedUser) {
        router.replace("/login?redirect=/settings");
      }
    };

    const handleAuthStateChange = (event: Event) => {
      const { detail } = event as CustomEvent<AuthUser | null>;
      const nextUser = detail ?? getStoredUser();
      setUser(nextUser);
      setHasCheckedAuth(true);

      if (!nextUser) {
        router.replace("/login?redirect=/settings");
      }
    };

    syncUser();
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    };
  }, [router]);

  useEffect(() => {
    const nextPronunciationVariant = getPronunciationVariantPreference();
    const nextTheme = getStoredTheme();
    const nextDictionarySource = getDictionarySourcePreference();

    setPronunciationVariant(nextPronunciationVariant);
    setTheme(nextTheme);
    setDictionarySource(nextDictionarySource);
    setSavedSettings({
      theme: nextTheme,
      pronunciationVariant: nextPronunciationVariant,
      dictionarySource: nextDictionarySource,
    });
  }, []);

  const handlePronunciationVariantChange = (variant: PronunciationVariant) => {
    setPronunciationVariant(variant);
    setHasSaved(false);
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    setHasSaved(false);
  };

  const handleDictionarySourceChange = (
    source: DictionarySourcePreference,
  ) => {
    setDictionarySource(source);
    setHasSaved(false);
  };

  const handleSave = () => {
    applyTheme(theme);
    localStorage.setItem(
      PRONUNCIATION_SETTING_KEY,
      pronunciationVariant,
    );
    localStorage.setItem(DICTIONARY_SOURCE_SETTING_KEY, dictionarySource);
    setSavedSettings({ theme, pronunciationVariant, dictionarySource });
    setHasSaved(true);
  };

  const hasChanges =
    savedSettings !== null &&
    (theme !== savedSettings.theme ||
      pronunciationVariant !== savedSettings.pronunciationVariant ||
      dictionarySource !== savedSettings.dictionarySource);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "MA";

  if (!hasCheckedAuth || !user) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-normal text-[var(--app-text-strong)] sm:mb-12 sm:text-5xl">
        Настройки
      </h1>

      <section>
        <div className="overflow-hidden rounded-none border-x border-t border-[var(--app-border)]">
          <div className="flex items-center gap-4 border-b border-[var(--app-border)] px-4 py-5 sm:gap-5 sm:px-7 sm:py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral text-base font-semibold text-neutral-content">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-[var(--app-text-strong)]">
                {user?.username || "Пользователь"}
              </div>
              <div className="truncate text-base font-normal text-neutral-content">
                {user?.email || "Войдите, чтобы увидеть данные аккаунта"}
              </div>
            </div>
          </div>

          <SettingsRow
            label="Имя пользователя"
            value={user?.username || "Не указано"}
          />
          <SettingsRow
            label="Эл. почта"
            value={user?.email || "Не указано"}
          />
          <ThemeSettingsRow
            value={theme}
            onChange={handleThemeChange}
          />
          <PronunciationSettingsRow
            value={pronunciationVariant}
            onChange={handlePronunciationVariantChange}
          />
          <DictionarySourceSettingsRow
            value={dictionarySource}
            onChange={handleDictionarySourceChange}
          />
        </div>
        <div className="mt-6 flex flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center sm:gap-4">
          {hasSaved && (
            <span
              className="text-sm font-medium text-success"
              role="status"
              aria-live="polite"
            >
              Настройки сохранены
            </span>
          )}
          <button
            type="button"
            className="btn btn-primary w-full px-8 sm:w-auto sm:min-w-40"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Сохранить
          </button>
        </div>
      </section>
    </div>
  );
}

function ThemeSettingsRow({
  value,
  onChange,
}: {
  value: AppTheme;
  onChange: (value: AppTheme) => void;
}) {
  return (
    <div className="grid gap-5 border-b border-[var(--app-border)] px-4 py-5 sm:px-7 sm:py-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
      <div>
        <div className="mb-2 text-lg font-semibold text-[var(--app-text-strong)]">
          Тема
        </div>
        <div className="text-base font-normal text-neutral-content">
          Выберите цветовую тему интерфейса.
        </div>
      </div>

      <label className="relative block">
        <select
          className="h-14 w-full appearance-none rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-field-deep)] px-4 pr-12 text-base font-medium text-[var(--app-text-strong)] outline-none transition-colors hover:border-[var(--app-focus)] focus:border-[var(--app-focus)]"
          value={value}
          onChange={(event) => onChange(event.target.value as AppTheme)}
        >
          <option value={THEMES.darkClassic}>Темная классик</option>
          <option value={THEMES.lightClassic}>Светлая классик</option>
          <option value={THEMES.light}>DaisyUI light</option>
          <option value={THEMES.dark}>DaisyUI dark</option>
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </label>
    </div>
  );
}

function PronunciationSettingsRow({
  value,
  onChange,
}: {
  value: PronunciationVariant;
  onChange: (value: PronunciationVariant) => void;
}) {
  return (
    <div className="grid gap-5 border-b border-[var(--app-border)] px-4 py-5 sm:px-7 sm:py-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
      <div>
        <div className="mb-2 text-lg font-semibold text-[var(--app-text-strong)]">
          Звук и транскрипция по умолчанию для новых слов
        </div>
        <div className="text-base font-normal text-neutral-content">
          Выберите, какой вариант произношения использовать первым.
        </div>
      </div>

      <label className="relative block">
        <select
          className="h-14 w-full appearance-none rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-field-deep)] px-4 pr-12 text-base font-medium text-[var(--app-text-strong)] outline-none transition-colors hover:border-[var(--app-focus)] focus:border-[var(--app-focus)]"
          value={value}
          onChange={(event) =>
            onChange(event.target.value as PronunciationVariant)
          }
        >
          <option value="uk">🇬🇧 Британский</option>
          <option value="us">🇺🇸 Американский</option>
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </label>
    </div>
  );
}

function DictionarySourceSettingsRow({
  value,
  onChange,
}: {
  value: DictionarySourcePreference;
  onChange: (value: DictionarySourcePreference) => void;
}) {
  return (
    <div className="grid gap-5 border-b border-[var(--app-border)] px-4 py-5 sm:px-7 sm:py-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
      <div>
        <div className="mb-2 text-lg font-semibold text-[var(--app-text-strong)]">
          Словарь
        </div>
        <div className="text-base font-normal text-neutral-content">
          Выберите источник значений, транскрипции и произношения.
        </div>
      </div>

      <label className="relative block">
        <select
          className="h-14 w-full appearance-none rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-field-deep)] px-4 pr-12 text-base font-medium text-[var(--app-text-strong)] outline-none transition-colors hover:border-[var(--app-focus)] focus:border-[var(--app-focus)]"
          value={value}
          onChange={(event) =>
            onChange(event.target.value as DictionarySourcePreference)
          }
        >
          <option value="cambridge">Cambridge Dictionary</option>
          <option value="oxford">Oxford Learner&apos;s Dictionaries</option>
        </select>
        <SelectChevron />
      </label>
    </div>
  );
}

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-content">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-24 flex-col items-start justify-between gap-4 border-b border-[var(--app-border)] px-4 py-5 sm:flex-row sm:items-center sm:gap-8 sm:px-7 sm:py-6">
      <div className="min-w-0">
        <div className="mb-3 text-lg font-semibold text-[var(--app-text-strong)]">{label}</div>
        <div className="truncate text-lg font-normal text-neutral-content">
          {value}
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 text-lg font-semibold text-[var(--app-focus)] transition-colors hover:text-[var(--app-text-strong)]"
      >
        Редактировать
      </button>
    </div>
  );
}
