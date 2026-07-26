import Sidebar from "./Sidebar";
import Header from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

const MainLayout = ({ children, isAuthenticated }: MainLayoutProps) => {
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen min-w-0 flex-col">
        <Header isAuthenticated={false} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="drawer min-h-screen lg:drawer-open">
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
