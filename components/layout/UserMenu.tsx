"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
}

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Получаем пользователя из localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/login" className="btn btn-ghost btn-sm text-neutral-content hover:text-white">
          Войти
        </Link>
        <Link href="/register" className="btn btn-primary btn-sm rounded-full px-4">
          Регистрация
        </Link>
      </div>
    );
  }

  const initials = user.username ? user.username.slice(0, 2).toUpperCase() : "ME";

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
        <div className="bg-neutral text-neutral-content rounded-full w-10">
          <span className="text-sm font-bold">{initials}</span>
        </div>
      </div>
      <div
        tabIndex={0}
        className="dropdown-content z-[1] menu p-4 shadow-lg bg-base-200 rounded-box w-72 mt-2 border border-neutral/20"
      >
        {/* Информация о пользователе */}
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-12">
              <span className="text-lg font-bold">{initials}</span>
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-white truncate" title={user.username}>{user.username}</div>
            <div className="text-xs text-neutral-content truncate" title={user.email}>{user.email}</div>
          </div>
        </div>

        <div className="divider my-0"></div>

        {/* Меню */}
        <ul className="menu menu-sm gap-1 px-0">
          <li>
            <a className="text-neutral-content hover:text-white hover:bg-base-300 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Настройки
            </a>
          </li>
        </ul>

        <div className="divider my-0"></div>

        <div className="mt-2">
          <button 
            onClick={handleLogout}
            className="btn btn-ghost btn-sm w-full justify-start text-neutral-content hover:text-white hover:bg-base-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
