export function resolveSafeRedirect(
  redirect: string | null,
  fallback = "/",
) {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return fallback;
  }

  return redirect;
}
