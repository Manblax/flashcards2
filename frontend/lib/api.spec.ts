import { describe, expect, it, vi } from "vitest";

import { DICTIONARY_SOURCE_SETTING_KEY } from "./dictionary-settings";
import {
  getGoogleAuthUrl,
  getModules,
  getPublicApiUrl,
  lookupDictionary,
} from "./api";

describe("api utilities", () => {
  it("builds public API URLs", () => {
    expect(getPublicApiUrl()).toBe("http://localhost:3001");
    expect(getPublicApiUrl("/auth/login")).toBe(
      "http://localhost:3001/auth/login",
    );
    expect(getGoogleAuthUrl()).toBe("http://localhost:3001/auth/google");
  });

  it("does not request modules when there is no auth token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getModules()).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests modules with bearer auth when a token is stored", async () => {
    localStorage.setItem("token", "stored-token");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: "module-1" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getModules(20, 10)).resolves.toEqual([{ id: "module-1" }]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3001/flashcards?skip=20&take=10");
    expect(init.headers.get("Authorization")).toBe("Bearer stored-token");
  });

  it("returns an empty module list for unauthorized responses", async () => {
    localStorage.setItem("token", "stored-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await expect(getModules()).resolves.toEqual([]);
  });

  it("looks up dictionary entries with the stored source preference", async () => {
    localStorage.setItem("token", "stored-token");
    localStorage.setItem(DICTIONARY_SOURCE_SETTING_KEY, "oxford");
    const lookupResult = {
      word: "run",
      normalizedWord: "run",
      suggestedDefinition: null,
      definitions: [],
      ipa: {},
      audio: {},
      sources: {},
      cached: false,
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(lookupResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupDictionary("run")).resolves.toEqual(lookupResult);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "http://localhost:3001/dictionary/lookup?word=run&source=oxford",
    );
    expect(init.headers.get("Authorization")).toBe("Bearer stored-token");
  });
});
