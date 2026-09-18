import { getPublicApiUrl, lookupDictionary, synthesizeSpeech } from "./api";
import { getDictionarySourcePreference } from "./dictionary-settings";
import {
  getAlternatePronunciationVariant,
  type PronunciationVariant,
} from "./pronunciation-settings";

export type PronunciationMode = "dictionary" | "exact" | "speech";
type Clip = { url: string; variant: PronunciationVariant };
export function isAuthenticationError(error: unknown) {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
}
export function isAutoplayError(error: unknown) {
  return (error as { name?: string } | null)?.name === "NotAllowedError";
}

// One session owns its Blob URLs; disposal also invalidates pending requests.
export class PronunciationSession {
  private static active: PronunciationSession | null = null;
  private cache = new Map<string, Promise<Clip[]>>();
  private speech = new Map<string, Promise<Clip>>();
  private urls = new Set<string>();
  private failed = new Set<string>();
  private audio: HTMLAudioElement | null = null;
  private generation = 0;

  stop() {
    this.generation++;
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
  }

  dispose() {
    this.stop();
    if (PronunciationSession.active === this)
      PronunciationSession.active = null;
    this.urls.forEach((url) => URL.revokeObjectURL(url));
    this.urls.clear();
    this.cache.clear();
    this.speech.clear();
    this.failed.clear();
  }

  async play(
    text: string,
    variant: PronunciationVariant,
    mode: PronunciationMode,
  ): Promise<PronunciationVariant | null> {
    PronunciationSession.active?.stop();
    PronunciationSession.active = this;
    this.stop();
    const generation = this.generation;
    const current = () => generation === this.generation;
    const word = text.trim();
    if (!word) throw new Error("Empty text");
    const key = JSON.stringify([
      word,
      variant,
      getDictionarySourcePreference(),
      mode,
    ]);
    let candidates = this.cache.get(key);
    if (!candidates) {
      candidates = (async () => {
        if (mode === "speech") return [];
        try {
          const result = await lookupDictionary(word);
          const variants =
            mode === "exact"
              ? [variant]
              : [variant, getAlternatePronunciationVariant(variant)];
          return variants.flatMap((accent) =>
            result.audio[accent]
              ? [
                  {
                    url: getPublicApiUrl(result.audio[accent]),
                    variant: accent,
                  },
                ]
              : [],
          );
        } catch (error) {
          if (isAuthenticationError(error)) throw error;
          return [];
        }
      })();
      this.cache.set(key, candidates);
      void candidates.catch(() => this.cache.delete(key));
    }
    for (const clip of await candidates) {
      if (!current()) return null;
      if (this.failed.has(clip.url)) continue;
      try {
        await this.playClip(clip.url);
        return current() ? clip.variant : null;
      } catch (error) {
        if (!current()) return null;
        if (isAutoplayError(error)) throw error;
        this.failed.add(clip.url);
      }
    }
    if (!current()) return null;
    let speech = this.speech.get(key);
    if (!speech) {
      speech = synthesizeSpeech(word, variant).then((blob) => {
        // Navigation must not leave an unowned object URL behind.
        if (!current())
          throw new DOMException("Playback cancelled", "AbortError");
        const url = URL.createObjectURL(blob);
        this.urls.add(url);
        return { url, variant };
      });
      this.speech.set(key, speech);
      void speech.catch(() => this.speech.delete(key));
    }
    const clip = await speech;
    if (!current()) return null;
    try {
      await this.playClip(clip.url);
    } catch (error) {
      if (!isAutoplayError(error)) {
        this.speech.delete(key);
        URL.revokeObjectURL(clip.url);
        this.urls.delete(clip.url);
      }
      throw error;
    }
    return current() ? clip.variant : null;
  }

  private async playClip(url: string) {
    if (this.audio) this.audio.pause();
    const audio = new Audio(url);
    this.audio = audio;
    // play() rejects for download/decode errors and browser autoplay denial.
    await audio.play();
  }
}
