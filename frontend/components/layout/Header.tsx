"use client";

import Link from "next/link";
import UserMenu from "./UserMenu";

const Header = () => {
  return (
    <header className="bg-base-100 border-b border-neutral/30 sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Левая часть - меню и поиск */}
        <div className="flex items-center gap-4">
          <button className="btn btn-ghost btn-sm">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="relative">
            <input
              type="text"
              placeholder="Поиск"
              className="input input-sm bg-base-200 w-64 pl-10"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-content"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Правая часть - кнопка создания и аватар */}
        <div className="flex items-center gap-4">
          <Link
            href="/create"
            className="btn btn-primary btn-circle btn-sm"
            title="Создать модуль"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Link>

          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;

