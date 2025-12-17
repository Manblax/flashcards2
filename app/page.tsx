import ModuleCard from "@/components/ModuleCard";
import { mockModules } from "@/lib/mockData";

export default function Home() {
  // Получаем 6 последних модулей
  const recentModules = mockModules.slice(0, 6);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <section>
        <h2 className="text-2xl font-bold mb-6">Недавние</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recentModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>
    </div>
  );
}

