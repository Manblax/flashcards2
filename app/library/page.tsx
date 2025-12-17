"use client";

import { useState } from "react";
import InfiniteModuleList from "@/components/InfiniteModuleList";
import { mockModules } from "@/lib/mockData";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState("modules");

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Табы */}
      <div className="tabs mb-8">
        <button
          className={`tab tab-lg pb-4 text-base font-semibold ${
            activeTab === "modules" 
              ? "tab-active border-b-2 border-primary text-white" 
              : "text-neutral-content"
          }`}
          onClick={() => setActiveTab("modules")}
        >
          Модули
        </button>
      </div>

      {/* Контент */}
      {activeTab === "modules" && (
        <InfiniteModuleList allModules={mockModules} />
      )}
    </div>
  );
}

