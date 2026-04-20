"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { persistAuthSession } from "@/lib/auth";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    const token = searchParams.get("access_token");
    const id = searchParams.get("id");
    const username = searchParams.get("username");
    const email = searchParams.get("email");

    if (!token || !id || !username || !email) {
      router.replace("/login?error=google_auth_invalid_response");
      return;
    }

    persistAuthSession(token, {
      id,
      username,
      email,
    });

    router.replace("/");
    router.refresh();
  }, [router, searchParams]);

  return <AuthCallbackLoadingState />;
}

function AuthCallbackLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="mt-4 text-neutral-content">Выполняем вход через Google...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoadingState />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
