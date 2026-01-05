import { getModule } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ModulePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { id } = await params;
  const module = await getModule(id);

  if (!module) {
    notFound();
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Хедер модуля */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">{module.title}</h1>
              <div className="flex items-center gap-2 text-sm text-neutral-content">
                <span className="font-bold text-white">{module.termCount} терминов</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className="avatar placeholder w-5 h-5 rounded-full bg-warning text-warning-content flex items-center justify-center text-xs font-bold">
                    {module.author[0].toUpperCase()}
                  </div>
                  <span className="font-medium hover:underline cursor-pointer">{module.author}</span>
                </div>
              </div>
            </div>
            
            {/* Кнопки действий */}
            <div className="flex gap-2">
              <button className="btn btn-square btn-ghost text-neutral-content" title="Поделиться">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <Link href={`/module/${module.id}/edit`} className="btn btn-square btn-ghost text-neutral-content" title="Редактировать">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Описание (если есть) */}
          {module.description && (
            <p className="text-neutral-content mb-6">{module.description}</p>
          )}

          {/* Кнопки режимов (Заучивание, Карточки и т.д.) */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button className="btn btn-primary gap-2 px-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Карточки
            </button>
            <button className="btn btn-outline border-neutral/30 hover:bg-neutral/20 hover:border-neutral/30 text-neutral-content hover:text-white gap-2 px-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Заучивание
            </button>
             <button className="btn btn-outline border-neutral/30 hover:bg-neutral/20 hover:border-neutral/30 text-neutral-content hover:text-white gap-2 px-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Тест
            </button>
          </div>
        </div>

        {/* Заголовок списка */}
        <h2 className="text-xl font-bold mb-4 text-white">Термины в этом модуле ({module.terms?.length || 0})</h2>

        {/* Список карточек */}
        <div className="space-y-3">
          {module.terms?.map((term) => (
            <div key={term.id} className="card bg-base-200 hover:bg-base-300 transition-colors rounded-xl border border-transparent hover:border-neutral/20">
              <div className="card-body p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                
                {/* Термин (Левая колонка) */}
                <div className="flex-1 min-w-0 border-r-0 sm:border-r border-neutral/20 sm:pr-8 w-full sm:w-auto pb-2 sm:pb-0 border-b sm:border-b-0">
                  <span className="text-base sm:text-lg font-medium text-white block break-words">{term.term}</span>
                </div>

                {/* Определение (Центральная колонка) */}
                <div className="flex-[2] min-w-0 w-full sm:w-auto">
                   <span className="text-base text-neutral-content block break-words">{term.definition}</span>
                </div>

                {/* Действия (Правая колонка) */}
                <div className="flex items-center gap-1 sm:ml-auto">
                   <button className={`btn btn-ghost btn-sm btn-circle ${term.isFavorite ? 'text-warning' : 'text-neutral-content hover:text-warning'}`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={term.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                     </svg>
                   </button>
                   <button className="btn btn-ghost btn-sm btn-circle text-neutral-content hover:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                   </button>
                   <button className="btn btn-ghost btn-sm btn-circle text-neutral-content hover:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                   </button>
                </div>

              </div>
            </div>
          ))}

          {/* Кнопка добавить термин (внизу, опционально, как в Quizlet) */}
          <div className="py-6 text-center">
             <Link href={`/module/${module.id}/edit`} className="btn btn-lg bg-base-200 hover:bg-base-300 border-none text-white font-bold min-w-[250px]">
                Добавить или удалить термины
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
