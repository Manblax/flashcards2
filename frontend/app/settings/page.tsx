"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AUTH_STATE_CHANGE_EVENT,
  getStoredUser,
  type AuthUser,
} from "@/lib/auth";

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

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

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "MA";

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-20 text-6xl font-semibold tracking-normal text-white sm:text-7xl">
        Настройки
      </h1>

      <section className="mb-14">
        <h2 className="mb-6 text-2xl font-medium text-white">Подписка</h2>
        <div className="rounded-2xl border border-[#29315c] bg-[#0b0d2b] px-8 py-7 text-neutral-content">
          Текущий план не подключен.
        </div>
      </section>

      <section>
        <div className="overflow-hidden rounded-none border-x border-t border-[#29315c]">
          <div className="flex items-center gap-6 border-b border-[#29315c] px-8 py-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral text-xl font-semibold text-neutral-content">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xl font-semibold text-white">
                {user?.username || "Пользователь"}
              </div>
              <div className="truncate text-lg font-normal text-neutral-content">
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
        </div>

        {!user ? (
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex rounded-full bg-primary px-7 py-3 text-base font-semibold text-white"
            >
              Войти
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-32 items-center justify-between gap-8 border-b border-[#29315c] px-8 py-8">
      <div className="min-w-0">
        <div className="mb-4 text-xl font-semibold text-white">{label}</div>
        <div className="truncate text-xl font-normal text-neutral-content">
          {value}
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 text-xl font-semibold text-[#a9b0ff] transition-colors hover:text-white"
      >
        Редактировать
      </button>
    </div>
  );
}
