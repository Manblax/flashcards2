"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

const MainLayout = ({ children, isAuthenticated }: MainLayoutProps) => {
  const pathname = usePathname();
  const isStudyPage = /^\/module\/[^/]+\/(card|learn|test|write|spell)\/?$/.test(pathname);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh min-w-0 flex-col [--app-header-height:73px]">
        <Header isAuthenticated={false} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className={`drawer min-h-dvh xl:drawer-open ${isStudyPage ? "study-shell" : ""}`}>
      <input
        id="app-sidebar"
        type="checkbox"
        className="drawer-toggle"
        aria-label="Переключить меню"
      />
      <div className="drawer-content flex min-w-0 flex-col">
        <Header isAuthenticated />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <div className="drawer-side z-40">
        <label
          htmlFor="app-sidebar"
          aria-label="Закрыть меню"
          className="drawer-overlay"
        />
        <Sidebar />
      </div>
    </div>
  );
};

export default MainLayout;
