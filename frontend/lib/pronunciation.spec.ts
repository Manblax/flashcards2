import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { lookupDictionary, synthesizeSpeech } from "./api";
import { PronunciationSession } from "./pronunciation";
import { DICTIONARY_SOURCE_SETTING_KEY } from "./dictionary-settings";

vi.mock("./api", () => ({
  lookupDictionary: vi.fn(),
  synthesizeSpeech: vi.fn(),
  getPublicApiUrl: (url: string) => url,
}));

describe("PronunciationSession", () => {
  let session: PronunciationSession;
  let play: ReturnType<typeof vi.fn>;
  let pause: ReturnType<typeof vi.fn>;
  let created: string[];
  beforeEach(() => {
    vi.mocked(lookupDictionary)
      .mockReset()
      .mockResolvedValue({ audio: { uk: "/uk", us: "/us" } } as any);
    vi.mocked(synthesizeSpeech)
      .mockReset()
      .mockResolvedValue(new Blob(["mp3"]));
    created = [];
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
    vi.stubGlobal(
      "Audio",
      vi.fn(function (this: any, url: string) {
        created.push(url);
        this.play = play;
        this.pause = pause;
      }),
    );
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = vi.fn(() => "blob:tts");
        static revokeObjectURL = vi.fn();
      },
    );
    session = new PronunciationSession();
  });
  afterEach(() => session.dispose());

  it("plays preferred recording and reuses lookup on replay", async () => {
    await session.play(" apple ", "us", "dictionary");
    await session.play("apple", "us", "dictionary");
    expect(created).toEqual(["/us", "/us"]);
    expect(lookupDictionary).toHaveBeenCalledTimes(1);
    expect(synthesizeSpeech).not.toHaveBeenCalled();
  });

  it("tries alternate recording before generating speech after a failed download", async () => {
    play.mockRejectedValueOnce(
      new DOMException("Download failed", "NotSupportedError"),
    );
    expect(await session.play("apple", "us", "dictionary")).toBe("uk");
    expect(created).toEqual(["/us", "/uk"]);
    expect(synthesizeSpeech).not.toHaveBeenCalled();
  });

  it("generates in preferred accent when all recordings fail", async () => {
    play
      .mockRejectedValueOnce(new Error("download"))
      .mockRejectedValueOnce(new Error("decode"));
    await session.play("apple", "us", "dictionary");
    expect(created).toEqual(["/us", "/uk", "blob:tts"]);
    expect(synthesizeSpeech).toHaveBeenCalledWith("apple", "us");
  });

  it("uses only the explicitly requested accent", async () => {
    vi.mocked(lookupDictionary).mockResolvedValue({
      audio: { uk: "/uk" },
    } as any);
    await session.play("apple", "us", "exact");
    expect(created).toEqual(["blob:tts"]);
    expect(synthesizeSpeech).toHaveBeenCalledWith("apple", "us");
  });

  it("falls back when dictionary service is unavailable", async () => {
    vi.mocked(lookupDictionary).mockRejectedValue(new Error("502"));
    await session.play("apple", "uk", "dictionary");
    expect(synthesizeSpeech).toHaveBeenCalledWith("apple", "uk");
  });

  it.each([401, 403])(
    "does not synthesize after authentication failure %s",
    async (status) => {
      vi.mocked(lookupDictionary).mockRejectedValue({ status });
      await expect(session.play("apple", "uk", "dictionary")).rejects.toEqual({
        status,
      });
      expect(synthesizeSpeech).not.toHaveBeenCalled();
    },
  );

  it("does not fall back on autoplay denial", async () => {
    play.mockRejectedValueOnce(
      new DOMException("Click required", "NotAllowedError"),
    );
    await expect(
      session.play("apple", "uk", "dictionary"),
    ).rejects.toMatchObject({ name: "NotAllowedError" });
    await session.play("apple", "uk", "dictionary");
    expect(created).toEqual(["/uk", "/uk"]);
    expect(synthesizeSpeech).not.toHaveBeenCalled();
  });

  it("reuses generated MP3 after autoplay denial, and revokes it on cleanup", async () => {
    play.mockRejectedValueOnce(
      new DOMException("Click required", "NotAllowedError"),
    );
    await expect(
      session.play("definition", "uk", "speech"),
    ).rejects.toMatchObject({ name: "NotAllowedError" });
    await session.play("definition", "uk", "speech");
    expect(synthesizeSpeech).toHaveBeenCalledTimes(1);
    expect(lookupDictionary).not.toHaveBeenCalled();
    session.dispose();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:tts");
  });

  it("retries failed synthesis", async () => {
    vi.mocked(synthesizeSpeech).mockRejectedValueOnce(new Error("unavailable"));
    await expect(session.play("definition", "uk", "speech")).rejects.toThrow(
      "unavailable",
    );
    await session.play("definition", "uk", "speech");
    expect(synthesizeSpeech).toHaveBeenCalledTimes(2);
  });

  it("discards a lookup that finishes after navigation", async () => {
    let resolve!: (value: any) => void;
    vi.mocked(lookupDictionary).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const pending = session.play("apple", "uk", "dictionary");
    session.dispose();
    resolve({ audio: { uk: "/uk" } });
    expect(await pending).toBeNull();
    expect(created).toEqual([]);
    expect(synthesizeSpeech).not.toHaveBeenCalled();
  });

  it("does not leak Blob URLs when synthesis completes after navigation", async () => {
    let resolve!: (value: Blob) => void;
    vi.mocked(synthesizeSpeech).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const pending = session.play("definition", "uk", "speech");
    await vi.waitFor(() => expect(synthesizeSpeech).toHaveBeenCalled());
    session.dispose();
    resolve(new Blob(["mp3"]));
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(created).toEqual([]);
  });

  it("keys lookup cache by text, accent and dictionary preference", async () => {
    await session.play("apple", "uk", "dictionary");
    await session.play("apple", "us", "dictionary");
    localStorage.setItem(DICTIONARY_SOURCE_SETTING_KEY, "oxford");
    await session.play("apple", "us", "dictionary");
    await session.play("pear", "us", "dictionary");
    expect(lookupDictionary).toHaveBeenCalledTimes(4);
  });

  it("stops playback when another control starts", async () => {
    await session.play("apple", "uk", "dictionary");
    const other = new PronunciationSession();
    await other.play("pear", "us", "dictionary");
    expect(pause).toHaveBeenCalled();
    other.dispose();
  });
});
