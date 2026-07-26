"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncAuthCookieFromStorage } from "@/lib/auth";

export default function AuthSessionSync() {
  const router = useRouter();

  useEffect(() => {
    if (syncAuthCookieFromStorage()) {
      router.refresh();
    }
  }, [router]);

  return null;
}
