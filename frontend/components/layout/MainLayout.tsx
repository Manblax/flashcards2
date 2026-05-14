import Sidebar from "./Sidebar";
import Header from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

const MainLayout = ({ children, isAuthenticated }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen">
      {isAuthenticated && <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Header isAuthenticated={isAuthenticated} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
