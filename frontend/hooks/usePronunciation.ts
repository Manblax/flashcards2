"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isAuthenticationError,
  isAutoplayError,
  PronunciationSession,
  type PronunciationMode,
} from "@/lib/pronunciation";
import {
  getPronunciationVariantPreference,
  type PronunciationVariant,
} from "@/lib/pronunciation-settings";

export function usePronunciation(
  text: string,
  options: {
    mode?: PronunciationMode;
    variant?: PronunciationVariant;
    autoPlay?: boolean;
    promptKey?: string;
  } = {},
) {
  const {
    mode = "dictionary",
    variant,
    autoPlay = false,
    promptKey = "",
  } = options;
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const session = useRef<PronunciationSession | null>(null);
  const request = useRef(0);

  const play = useCallback(async () => {
    const id = ++request.current;
    const accent = variant ?? getPronunciationVariantPreference();
    session.current ??= new PronunciationSession();
    setStatus("loading");
    setMessage(null);
    try {
      const played = await session.current.play(text, accent, mode);
      if (request.current !== id) return;
      if (!played) {
        setStatus("idle");
        return;
      }
      setStatus("ready");
      setMessage(
        played !== accent
          ? `Используется ${played.toUpperCase()} произношение`
          : null,
      );
    } catch (error) {
      if (request.current !== id) return;
      if ((error as { name?: string })?.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
      setMessage(
        isAutoplayError(error)
          ? "Нажмите на динамик, чтобы воспроизвести звук."
          : isAuthenticationError(error)
            ? "Войдите в аккаунт, чтобы прослушать произношение."
            : "Произношение не найдено. Можно продолжить по определению.",
      );
    }
  }, [text, mode, variant]);

  useEffect(() => {
    setStatus("idle");
    setMessage(null);
    if (text && autoPlay) void play();
    return () => {
      request.current++;
      session.current?.dispose();
      session.current = null;
    };
  }, [text, play, autoPlay, promptKey]);

  return {
    status,
    message,
    play: () => void play(),
    replay: () => void play(),
  };
}
