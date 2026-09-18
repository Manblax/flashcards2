"use client";

import { usePronunciation } from "@/hooks/usePronunciation";
import type { PronunciationVariant } from "@/lib/pronunciation-settings";

interface PronunciationButtonProps {
  term: string;
  className?: string;
}
export default function PronunciationButton({
  term,
  className = "btn btn-ghost btn-sm gap-1 px-2 text-neutral-content hover:text-[var(--app-text-strong)]",
}: PronunciationButtonProps) {
  return (
    <div
      className="flex items-center"
      role="group"
      aria-label={`Произношение: ${term}`}
    >
      {(["uk", "us"] as const).map((variant) => (
        <AccentButton
          key={variant}
          term={term}
          variant={variant}
          className={className}
        />
      ))}
    </div>
  );
}

function AccentButton({
  term,
  variant,
  className,
}: PronunciationButtonProps & { variant: PronunciationVariant }) {
  const speech = usePronunciation(term, { mode: "exact", variant });
  const label = variant.toUpperCase();
  return (
    <span>
      <button
        type="button"
        className={
          speech.status === "error"
            ? "btn btn-ghost btn-sm gap-1 px-2 text-error"
            : className
        }
        onClick={speech.play}
        disabled={speech.status === "loading"}
        title={speech.message ?? `Воспроизвести ${label} произношение`}
        aria-label={`Воспроизвести ${label} произношение: ${term}`}
      >
        <span className="font-semibold">{label}</span>
        {speech.status === "loading" ? (
          <span
            className="loading loading-spinner loading-xs"
            aria-hidden="true"
          />
        ) : (
          <SpeakerIcon />
        )}
      </button>
      {speech.message && (
        <span role="status" className="sr-only">
          {speech.message}
        </span>
      )}
    </span>
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
