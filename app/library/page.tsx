import InfiniteModuleList from "@/components/InfiniteModuleList";
import { getModules } from "@/lib/api";
import { Module } from "@/types/module";

export default async function LibraryPage() {
  let initialModules: Module[] = [];
  
  try {
    initialModules = await getModules(0, 20);
  } catch (error) {
    console.error("Failed to fetch modules:", error);
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Табы */}
      <div className="tabs mb-8">
        <button
          className="tab tab-lg pb-4 text-base font-semibold tab-active border-b-2 border-primary text-white"
        >
          Модули
        </button>
      </div>

      {/* Контент */}
      <InfiniteModuleList initialModules={initialModules} />
    </div>
  );
}
