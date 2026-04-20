import ModuleCard from "@/components/ModuleCard";
import { getModules } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";
import { Module } from "@/types/module";

export default async function Home() {
  let recentModules: Module[] = [];
  const token = await getServerAuthToken();
  
  if (token) {
    try {
    recentModules = await getModules(0, 6, { token });
    } catch (error) {
      console.error("Failed to fetch modules:", error);
    }
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <section>
        <h2 className="text-2xl font-bold mb-6 text-white">Недавние</h2>
        {!token ? (
          <div className="text-neutral-content">
            Войдите, чтобы увидеть свои модули.
          </div>
        ) : recentModules.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recentModules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        ) : (
          <div className="text-neutral-content">
            Нет недавних модулей. Создайте первый!
          </div>
        )}
      </section>
    </div>
  );
}
