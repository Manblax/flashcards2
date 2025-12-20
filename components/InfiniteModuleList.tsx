"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Module } from "@/types/module";
import ModuleCard from "./ModuleCard";

interface InfiniteModuleListProps {
  allModules: Module[];
}

interface GroupedModules {
  title: string;
  modules: Module[];
}

const MODULES_PER_PAGE = 20;

const InfiniteModuleList = ({ allModules }: InfiniteModuleListProps) => {
  const [displayedModules, setDisplayedModules] = useState<Module[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Загружаем первую страницу при монтировании
  useEffect(() => {
    loadMoreModules();
  }, []);

  const loadMoreModules = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Имитируем задержку загрузки
    setTimeout(() => {
      const startIndex = (page - 1) * MODULES_PER_PAGE;
      const endIndex = startIndex + MODULES_PER_PAGE;
      const newModules = allModules.slice(startIndex, endIndex);

      if (newModules.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedModules((prev) => [...prev, ...newModules]);
        setPage((prev) => prev + 1);
        
        if (endIndex >= allModules.length) {
          setHasMore(false);
        }
      }

      setIsLoading(false);
    }, 500);
  }, [page, allModules, isLoading, hasMore]);

  // Настраиваем Intersection Observer для бесконечной прокрутки
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreModules();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading, loadMoreModules]);

  // Группируем модули по периодам
  const groupModulesByPeriod = (modules: Module[]): GroupedModules[] => {
    const groups: GroupedModules[] = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek: Module[] = [];
    const lastWeek: Module[] = [];
    const older: Module[] = [];

    modules.forEach((module) => {
      if (module.createdAt >= oneWeekAgo) {
        thisWeek.push(module);
      } else if (module.createdAt >= twoWeeksAgo) {
        lastWeek.push(module);
      } else {
        older.push(module);
      }
    });

    if (thisWeek.length > 0) {
      groups.push({ title: "НА ЭТОЙ НЕДЕЛЕ", modules: thisWeek });
    }
    if (lastWeek.length > 0) {
      groups.push({ title: "НА ПРОШЛОЙ НЕДЕЛЕ", modules: lastWeek });
    }
    if (older.length > 0) {
      // Определяем месяц для более старых модулей
      const month = older[0].createdAt.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
      }).toUpperCase();
      groups.push({ title: month, modules: older });
    }

    return groups;
  };

  const groupedModules = groupModulesByPeriod(displayedModules);

  return (
    <div>
      {groupedModules.map((group, index) => (
        <div key={index} className="mb-12">
          <h2 className="text-sm font-bold text-neutral-content mb-4 tracking-wider">
            {group.title}
          </h2>
          <div className="flex flex-col gap-3">
            {group.modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </div>
      ))}

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {/* Элемент для отслеживания прокрутки */}
      {hasMore && !isLoading && (
        <div ref={observerRef} className="h-20" />
      )}

      {/* Сообщение о конце списка */}
      {!hasMore && displayedModules.length > 0 && (
        <div className="text-center py-8 text-neutral-content">
          Все модули загружены
        </div>
      )}
    </div>
  );
};

export default InfiniteModuleList;

