import type { Module } from "@/types/module";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RequestOptions {
  token?: string | null;
}

function resolveAuthToken(token?: string | null) {
  return token ?? getClientToken();
}

function getClientToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

function withAuthHeaders(headers?: HeadersInit, token?: string | null) {
  const finalHeaders = new Headers(headers);
  const authToken = resolveAuthToken(token);

  if (authToken) {
    finalHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  return finalHeaders;
}

async function apiFetch(path: string, init: RequestInit = {}, token?: string | null) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: withAuthHeaders(init.headers, token),
  });
}

export function getGoogleAuthUrl() {
  return `${API_URL}/auth/google`;
}

export async function getModules(
  skip = 0,
  take = 20,
  options: RequestOptions = {},
): Promise<Module[]> {
  const authToken = resolveAuthToken(options.token);

  if (!authToken) {
    return [];
  }

  const res = await apiFetch(`/flashcards?skip=${skip}&take=${take}`, {
    cache: "no-store",
  }, authToken);
  
  if (res.status === 401 || res.status === 403) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Failed to fetch modules");
  }
  
  return res.json();
}

export async function getModule(
  id: string,
  options: RequestOptions = {},
): Promise<Module | null> {
  const authToken = resolveAuthToken(options.token);

  if (!authToken) {
    return null;
  }

  const res = await apiFetch(`/flashcards/${id}`, {
    cache: "no-store",
  }, authToken);
  
  if (!res.ok) {
    return null;
  }
  
  return res.json();
}

export async function createModule(
  data: any,
  options: RequestOptions = {},
): Promise<Module> {
  const res = await apiFetch("/flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, options.token);
  
  if (!res.ok) {
    throw new Error("Failed to create module");
  }
  
  return res.json();
}

export async function updateModule(
  id: string,
  data: any,
  options: RequestOptions = {},
): Promise<Module> {
  const res = await apiFetch(`/flashcards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, options.token);
  
  if (!res.ok) {
    throw new Error("Failed to update module");
  }
  
  return res.json();
}

export async function deleteModule(id: string, options: RequestOptions = {}) {
  const res = await apiFetch(`/flashcards/${id}`, {
    method: "DELETE",
  }, options.token);
  
  if (!res.ok) {
    throw new Error("Failed to delete module");
  }
  
  return res.json();
}

export async function uploadFile(file: File, options: RequestOptions = {}) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch("/upload", {
    method: "POST",
    body: formData,
  }, options.token);

  if (!res.ok) {
    throw new Error("Failed to upload file");
  }

  return res.json();
}

export async function register(data: any) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Registration failed");
  }
  
  return res.json();
}

export async function login(data: any) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Login failed");
  }
  
  return res.json();
}
