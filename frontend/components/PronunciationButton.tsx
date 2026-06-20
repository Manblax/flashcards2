"use client";

import { useRef, useState } from "react";
import {
  getPublicApiUrl,
  lookupDictionary,
  type DictionaryLookupResult,
} from "@/lib/api";

type PronunciationVariant = "uk" | "us";

interface PronunciationButtonProps {
  term: string;
  className?: string;
}

export default function PronunciationButton({
  term,
  className = "btn btn-ghost btn-sm gap-1 px-2 text-neutral-content hover:text-[var(--app-text-strong)]",
}: PronunciationButtonProps) {
  const [loading, setLoading] = useState<Record<PronunciationVariant, boolean>>({
    uk: false,
    us: false,
  });
  const [errors, setErrors] = useState<Record<PronunciationVariant, boolean>>({
    uk: false,
    us: false,
  });
  const lookupRef = useRef<Promise<DictionaryLookupResult> | null>(null);
  const audioUrlsRef = useRef<Partial<Record<PronunciationVariant, string>>>({});
  const playbackLocksRef = useRef<Record<PronunciationVariant, boolean>>({
    uk: false,
    us: false,
  });

  const playPronunciation = async (variant: PronunciationVariant) => {
    const normalizedTerm = term.trim();

    if (!normalizedTerm || playbackLocksRef.current[variant]) {
      return;
    }

    playbackLocksRef.current[variant] = true;
    setLoading((current) => ({ ...current, [variant]: true }));
    setErrors((current) => ({ ...current, [variant]: false }));

    try {
      let audioUrl = audioUrlsRef.current[variant];

      if (!audioUrl) {
        lookupRef.current ??= lookupDictionary(normalizedTerm).catch((error) => {
          lookupRef.current = null;
          throw error;
        });
        const result = await lookupRef.current;
        const variantAudioUrl = result.audio[variant];

        if (!variantAudioUrl) {
          throw new Error(`${variant.toUpperCase()} pronunciation audio not found`);
        }

        audioUrl = getPublicApiUrl(variantAudioUrl);
        audioUrlsRef.current[variant] = audioUrl;
      }

      const audio = new Audio(audioUrl);
      const releasePlaybackLock = () => {
        playbackLocksRef.current[variant] = false;
      };

      audio.addEventListener("ended", releasePlaybackLock, { once: true });
      audio.addEventListener("error", releasePlaybackLock, { once: true });
      await audio.play();
    } catch (error) {
      console.error("Failed to play pronunciation", error);
      setErrors((current) => ({ ...current, [variant]: true }));
      delete audioUrlsRef.current[variant];
      playbackLocksRef.current[variant] = false;
    } finally {
      setLoading((current) => ({ ...current, [variant]: false }));
    }
  };

  return (
    <div className="flex items-center" role="group" aria-label={`Произношение: ${term}`}>
      {(["uk", "us"] as const).map((variant) => {
        const label = variant.toUpperCase();
        const hasError = errors[variant];

        return (
          <button
            key={variant}
            type="button"
            className={
              hasError
                ? "btn btn-ghost btn-sm gap-1 px-2 text-error hover:text-error"
                : className
            }
            onClick={() => playPronunciation(variant)}
            disabled={loading[variant]}
            title={
              hasError
                ? `${label} произношение не найдено`
                : `Воспроизвести ${label} произношение`
            }
            aria-label={`Воспроизвести ${label} произношение: ${term}`}
          >
            <span className="font-semibold">{label}</span>
            {loading[variant] ? (
              <span
                className="loading loading-spinner loading-xs"
                aria-hidden="true"
              />
            ) : (
              <SpeakerIcon />
            )}
          </button>
        );
      })}
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
    </svg>
  );
}
