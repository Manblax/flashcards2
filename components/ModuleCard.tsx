import { Module } from "@/types/module";
import Link from "next/link";

interface ModuleCardProps {
  module: Module;
}

const ModuleCard = ({ module }: ModuleCardProps) => {
  return (
    <Link href={`/module/${module.id}`}>
      <div className="card bg-base-300/50 hover:bg-base-300 transition-all cursor-pointer border border-neutral/10 hover:border-primary/30 rounded-2xl overflow-hidden">
        <div className="card-body p-6 flex flex-row items-center gap-4">
          {/* Иконка модуля */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-7 h-7 text-primary"
              >
                <path d="M9 3v18m6-18v18M3 9h18M3 15h18" />
              </svg>
            </div>
          </div>

          {/* Контент */}
          <div className="flex-1 min-w-0">
            {/* Заголовок */}
            <h3 className="text-lg font-bold mb-1 text-white">
              {module.title}
            </h3>

            {/* Метаинформация */}
            <div className="text-sm text-neutral-content flex items-center gap-2">
              <span>
                {module.termCount} {getTermWord(module.termCount)}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <div className="avatar placeholder">
                  <div className="bg-warning text-warning-content rounded-full w-5 h-5">
                    <span className="text-xs font-semibold">
                      {module.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <span>Автор: {module.author}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Функция для правильного склонения слова "термин"
const getTermWord = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return "терминов";
  }

  if (lastDigit === 1) {
    return "термин";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "термина";
  }

  return "терминов";
};

export default ModuleCard;

