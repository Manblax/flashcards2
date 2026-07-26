"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_STATE_CHANGE_EVENT,
  clearAuthSession,
  getStoredAuthToken,
  syncAuthCookieFromStorage,
} from "@/lib/auth";
import { getAuthTokenExpiration } from "@/lib/auth-token";
import { validateAuthToken } from "@/lib/api";

const MAX_TIMEOUT_MS = 2_147_483_647;

export default function AuthSessionSync() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let expirationTimer: number | undefined;

    const scheduleExpiration = () => {
      window.clearTimeout(expirationTimer);

      const token = getStoredAuthToken();

      if (!token) {
        return;
      }

      const expiration = getAuthTokenExpiration(token);

      if (expiration === null) {
        return;
      }

      const delay = Math.min(
        Math.max(expiration - Date.now(), 0),
        MAX_TIMEOUT_MS,
      );

      expirationTimer = window.setTimeout(() => {
        if (getStoredAuthToken()) {
          scheduleExpiration();
          return;
        }

        clearAuthSession();
        router.refresh();
      }, delay);
    };

    const syncSession = () => {
      const sessionChanged = syncAuthCookieFromStorage();
      scheduleExpiration();
      return sessionChanged;
    };

    const validateSession = async () => {
      const token = getStoredAuthToken();

      if (!token) {
        return;
      }

      const isValid = await validateAuthToken(token);

      if (
        cancelled ||
        isValid !== false ||
        token !== getStoredAuthToken()
      ) {
        return;
      }

      clearAuthSession();
      router.refresh();
    };

    if (syncSession()) {
      router.refresh();
    }
    void validateSession();

    const handleAuthStateChange = () => {
      syncSession();
      router.refresh();
      void validateSession();
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "token" || event.key === "user") {
        if (syncSession()) {
          router.refresh();
        }
        void validateSession();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (syncSession()) {
          router.refresh();
        }
        void validateSession();
      }
    };

    window.addEventListener(
      AUTH_STATE_CHANGE_EVENT,
      handleAuthStateChange,
    );
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearTimeout(expirationTimer);
      window.removeEventListener(
        AUTH_STATE_CHANGE_EVENT,
        handleAuthStateChange,
      );
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [router]);

  return null;
}
