"use client";

import { useEffect, useState } from "react";
import {
  AUTH_STATE_CHANGE_EVENT,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

type PronunciationVariant = "uk" | "us";

const PRONUNCIATION_SETTING_KEY = "preferred-pronunciation-variant";

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pronunciationVariant, setPronunciationVariant] =
    useState<PronunciationVariant>("uk");

  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };

    const handleAuthStateChange = (event: Event) => {
      const { detail } = event as CustomEvent<AuthUser | null>;
      setUser(detail ?? getStoredUser());
    };

    syncUser();
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);
    };
  }, []);

  useEffect(() => {
    const storedVariant = localStorage.getItem(PRONUNCIATION_SETTING_KEY);

    if (storedVariant === "uk" || storedVariant === "us") {
      setPronunciationVariant(storedVariant);
    }
  }, []);

  const handlePronunciationVariantChange = (variant: PronunciationVariant) => {
    setPronunciationVariant(variant);
    localStorage.setItem(PRONUNCIATION_SETTING_KEY, variant);
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "MA";

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-12 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
        Настройки
      </h1>

      <section>
        <div className="overflow-hidden rounded-none border-x border-t border-[#29315c]">
          <div className="flex items-center gap-5 border-b border-[#29315c] px-7 py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral text-base font-semibold text-neutral-content">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-white">
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
          <PronunciationSettingsRow
            value={pronunciationVariant}
            onChange={handlePronunciationVariantChange}
          />
        </div>
      </section>
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
    <div className="grid gap-5 border-b border-[#29315c] px-7 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
      <div>
        <div className="mb-2 text-lg font-semibold text-white">
          Звук и транскрипция по умолчанию для новых слов
        </div>
        <div className="text-base font-normal text-neutral-content">
          Выберите, какой вариант произношения использовать первым.
        </div>
      </div>

      <label className="relative block">
        <select
          className="h-14 w-full appearance-none rounded-xl border border-[#6f79a7] bg-[#0f1130] px-4 pr-12 text-base font-medium text-white outline-none transition-colors hover:border-[#a9b0ff] focus:border-[#a9b0ff]"
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

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-24 items-center justify-between gap-8 border-b border-[#29315c] px-7 py-6">
      <div className="min-w-0">
        <div className="mb-3 text-lg font-semibold text-white">{label}</div>
        <div className="truncate text-lg font-normal text-neutral-content">
          {value}
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 text-lg font-semibold text-[#a9b0ff] transition-colors hover:text-white"
      >
        Редактировать
      </button>
    </div>
  );
}
