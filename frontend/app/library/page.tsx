import InfiniteModuleList from "@/components/InfiniteModuleList";
import { getModules } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";
import { Module } from "@/types/module";
import { redirect } from "next/navigation";

export default async function LibraryPage() {
  let initialModules: Module[] = [];
  const token = await getServerAuthToken();
  
  if (!token) {
    redirect("/login?redirect=/library");
  }

  try {
    initialModules = await getModules(0, 20, { token });
  } catch (error) {
    console.error("Failed to fetch modules:", error);
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Табы */}
      <div className="tabs mb-8">
        <button
          className="tab tab-lg pb-4 text-base font-semibold tab-active border-b-2 border-primary text-[var(--app-text-strong)]"
        >
          Модули
        </button>
      </div>

      {/* Контент */}
      <InfiniteModuleList initialModules={initialModules} />
    </div>
  );
}
