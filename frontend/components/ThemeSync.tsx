"use client";

import { useEffect } from "react";
import { getStoredTheme } from "@/lib/theme";

export default function ThemeSync() {
  useEffect(() => {
    document.documentElement.dataset.theme = getStoredTheme();
  }, []);

  return null;
}
