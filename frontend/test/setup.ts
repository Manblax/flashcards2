import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = "token=; path=/; max-age=0; samesite=lax";
  document.documentElement.removeAttribute("data-theme");
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
