"use client";

import {
  getAuthTokenExpiration,
  isAuthTokenActive,
} from "@/lib/auth-token";

const TOKEN_COOKIE_NAME = "token";
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
  const expiration = getAuthTokenExpiration(token);

  if (expiration === null) {
    clearTokenCookie();
    return;
  }

  const maxAge = Math.max(
    0,
    Math.floor((expiration - Date.now()) / 1000),
  );
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; samesite=lax`;
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

function removeStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  clearTokenCookie();
}

function parseStoredUser(storedUser: string | null): AuthUser | null {
  if (!storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser) as Partial<AuthUser>;

    if (
      typeof user.id !== "string" ||
      typeof user.username !== "string" ||
      typeof user.email !== "string"
    ) {
      return null;
    }

    return user as AuthUser;
  } catch (error) {
    console.error("Failed to parse stored user", error);
    return null;
  }
}

export function getStoredAuthToken() {
  const storedToken = localStorage.getItem("token");

  return storedToken && isAuthTokenActive(storedToken) ? storedToken : null;
}

export function getStoredUser(): AuthUser | null {
  const storedToken = getStoredAuthToken();
  const storedUser = parseStoredUser(localStorage.getItem("user"));

  if (!storedToken || !storedUser) {
    removeStoredSession();
    return null;
  }

  return storedUser;
}

export function persistAuthSession(token: string, user: AuthUser) {
  if (!isAuthTokenActive(token)) {
    clearAuthSession();
    return;
  }

  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  setTokenCookie(token);
  emitAuthStateChange(user);
}

export function clearAuthSession() {
  removeStoredSession();
  emitAuthStateChange(null);
}

export function syncAuthCookieFromStorage() {
  const storedToken = localStorage.getItem("token");
  const storedUserValue = localStorage.getItem("user");
  const storedUser = parseStoredUser(storedUserValue);
  const cookieToken = getCookieValue(TOKEN_COOKIE_NAME);

  if (!storedToken || !isAuthTokenActive(storedToken) || !storedUser) {
    const sessionChanged = Boolean(
      storedToken || storedUserValue || cookieToken,
    );

    if (sessionChanged) {
      removeStoredSession();
      emitAuthStateChange(null);
    }

    return sessionChanged;
  }

  if (cookieToken !== storedToken) {
    setTokenCookie(storedToken);
    return true;
  }

  return false;
}
