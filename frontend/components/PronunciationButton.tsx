"use client";

import { useRef, useState } from "react";
import { getPublicApiUrl, lookupDictionary } from "@/lib/api";

interface PronunciationButtonProps {
  term: string;
  className?: string;
}

export default function PronunciationButton({
  term,
  className = "btn btn-ghost btn-sm btn-circle text-neutral-content hover:text-[var(--app-text-strong)]",
}: PronunciationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioUrlRef = useRef<string | null>(null);

  const playPronunciation = async () => {
    const normalizedTerm = term.trim();

    if (!normalizedTerm || isLoading) {
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      if (!audioUrlRef.current) {
        const result = await lookupDictionary(normalizedTerm);
        const audioUrl = result.audio.uk || result.audio.us;

        if (!audioUrl) {
          throw new Error("Pronunciation audio not found");
        }

        audioUrlRef.current = getPublicApiUrl(audioUrl);
      }

      const audio = new Audio(audioUrlRef.current);
      await audio.play();
    } catch (error) {
      console.error("Failed to play pronunciation", error);
      setHasError(true);
      audioUrlRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClassName = hasError
    ? "btn btn-ghost btn-sm btn-circle text-error hover:text-error"
    : className;

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={playPronunciation}
      disabled={isLoading}
      title={hasError ? "Произношение не найдено" : "Воспроизвести произношение"}
      aria-label={`Воспроизвести произношение: ${term}`}
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-xs" aria-hidden="true" />
      ) : (
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
      )}
    </button>
  );
}
