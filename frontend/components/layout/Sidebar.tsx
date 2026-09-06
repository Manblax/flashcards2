"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
  const pathname = usePathname();

  const closeMobileMenu = () => {
    const sidebarToggle = document.getElementById(
      "app-sidebar",
    ) as HTMLInputElement | null;

    if (sidebarToggle) {
      sidebarToggle.checked = false;
    }
  };

  const menuItems = [
    { href: "/", label: "Главная", icon: "🏠" },
    { href: "/library", label: "Ваша библиотека", icon: "📚" },
  ];

  return (
    <aside className="flex min-h-dvh w-[min(20rem,86vw)] flex-col border-r border-neutral/30 bg-base-200 xl:min-h-screen xl:w-64">
      {/* Логотип */}
      <div className="flex items-center gap-3 px-5 py-5 sm:p-6">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-6 h-6 text-primary-content"
          >
            <path d="M9 3v18m6-18v18M3 9h18M3 15h18" />
          </svg>
        </div>
        <span className="text-xl font-bold">Q</span>
      </div>

      {/* Меню */}
      <nav className="flex-1 px-3 pb-6">
        <ul className="menu space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  pathname === item.href
                    ? "bg-neutral/50 text-[var(--app-text-strong)]"
                    : "text-neutral-content hover:bg-neutral/30"
                }`}
                onClick={closeMobileMenu}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
