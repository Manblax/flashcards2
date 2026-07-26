"use client";

const TOKEN_COOKIE_NAME = "token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60;
export const AUTH_STATE_CHANGE_EVENT = "auth-state-change";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const value = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

function setTokenCookie(token: string) {
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; samesite=lax`;
}

function clearTokenCookie() {
  document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

function emitAuthStateChange(user: AuthUser | null) {
  window.dispatchEvent(
    new CustomEvent<AuthUser | null>(AUTH_STATE_CHANGE_EVENT, {
      detail: user,
    }),
  );
}

export function getStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch (error) {
    console.error("Failed to parse stored user", error);
    localStorage.removeItem("user");
    return null;
  }
}

export function persistAuthSession(token: string, user: AuthUser) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  setTokenCookie(token);
  emitAuthStateChange(user);
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  clearTokenCookie();
  emitAuthStateChange(null);
}

export function syncAuthCookieFromStorage() {
  const storedToken = localStorage.getItem("token");
  const cookieToken = getCookieValue(TOKEN_COOKIE_NAME);

  if (!storedToken && cookieToken) {
    clearTokenCookie();
    return true;
  }

  if (storedToken && cookieToken !== storedToken) {
    setTokenCookie(storedToken);
    return true;
  }

  return false;
}
