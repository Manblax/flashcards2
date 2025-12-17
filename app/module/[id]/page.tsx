import { mockModules } from "@/lib/mockData";

interface ModulePageProps {
  params: {
    id: string;
  };
}

export default function ModulePage({ params }: ModulePageProps) {
  const module = mockModules.find((m) => m.id === params.id);

  if (!module) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Модуль не найден</h1>
          <p className="text-neutral-content">
            К сожалению, запрошенный модуль не существует
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{module.title}</h1>
          <p className="text-neutral-content">
            {module.termCount} терминов • Автор: {module.author}
          </p>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="text-center text-neutral-content py-12">
              Страница просмотра модуля будет реализована позже
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

