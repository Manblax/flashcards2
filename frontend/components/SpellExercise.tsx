"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent, RefObject } from "react";

import {
  getPublicApiUrl,
  lookupDictionary,
  type DictionaryLookupResult,
} from "@/lib/api";
import {
  beginSpellCorrection,
  clearSpellSession,
  continueCorrectSpellAnswer,
  createInitialSpellState,
  getExpectedAnswerDifference,
  getSpellOverallProgress,
  getSpellStageAccuracy,
  loadSpellSession,
  saveSpellSession,
  SPELL_MASTERY_TARGET,
  submitSpellAnswer,
  submitSpellCorrection,
  type SpellExerciseState,
} from "@/lib/spell-exercise";
import {
  getAlternatePronunciationVariant,
  getPronunciationVariantPreference,
  type PronunciationVariant,
} from "@/lib/pronunciation-settings";
import type { Term } from "@/types/module";

const CORRECT_FEEDBACK_DELAY_MS = 700;

interface SpellExerciseProps {
  moduleId: string;
  moduleTitle: string;
  terms: Term[];
}

export default function SpellExercise({
  moduleId,
  moduleTitle,
  terms,
}: SpellExerciseProps) {
  const [state, setState] = useState<SpellExerciseState | null>(null);
  const [answer, setAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const termsById = useMemo(
    () => new Map(terms.map((term) => [term.id, term])),
    [terms],
  );

  useEffect(() => {
    if (terms.length === 0) {
      return;
    }

    const restoredState = loadSpellSession(sessionStorage, moduleId, terms);
    setAnswer(restoredState?.feedback?.submittedAnswer ?? "");
    setState(restoredState ?? createInitialSpellState(terms));
  }, [moduleId, terms]);

  useEffect(() => {
    if (state) {
      saveSpellSession(sessionStorage, moduleId, terms, state);
    }
  }, [moduleId, state, terms]);

  useEffect(() => {
    if (
      state &&
      !state.completed &&
      !state.feedback &&
      !state.correctionError
    ) {
      setAnswer("");
      inputRef.current?.focus();
    }
  }, [state]);

  useEffect(() => {
    if (state?.feedback?.kind !== "correct") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setState((current) =>
        current
          ? continueCorrectSpellAnswer(current, terms)
          : current,
      );
    }, CORRECT_FEEDBACK_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [state?.feedback, terms]);

  const currentTerm =
    state && !state.completed
      ? termsById.get(state.queue[state.currentIndex]) ?? null
      : null;
  const isCorrection = Boolean(
    state?.correctionTermId &&
      state.correctionTermId === currentTerm?.id,
  );
  const pronunciation = useSpellPronunciation(
    currentTerm,
    Boolean(currentTerm && (!state?.feedback || isCorrection)),
    state
      ? `${state.stageNumber}:${state.currentIndex}:${isCorrection ? "correction" : "prompt"}`
      : "loading",
  );

  if (terms.length === 0) {
    return (
      <EmptySpellExercise moduleId={moduleId} moduleTitle={moduleTitle} />
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span
          className="loading loading-spinner loading-lg text-primary"
          aria-label="Загрузка упражнения spell"
        />
      </div>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentTerm || !answer.trim()) {
      return;
    }

    setState((current) => {
      if (!current) {
        return current;
      }

      return current.correctionTermId
        ? submitSpellCorrection(
            current,
            currentTerm,
            answer,
            terms,
          )
        : submitSpellAnswer(current, currentTerm, answer);
    });
  };

  const handleBeginCorrection = () => {
    setAnswer("");
    setState((current) =>
      current ? beginSpellCorrection(current) : current,
    );
  };

  const handleRestart = () => {
    clearSpellSession(sessionStorage, moduleId);
    setAnswer("");
    setState(createInitialSpellState(terms));
  };

  return (
    <div className="mobile-study-page page-container px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-8">
        <SpellSidebar
          moduleId={moduleId}
          moduleTitle={moduleTitle}
          state={state}
          totalTermCount={terms.length}
        />

        <main className="min-w-0">
          {state.completed ? (
            <SpellSummary
              moduleId={moduleId}
              state={state}
              terms={terms}
              onRestart={handleRestart}
            />
          ) : currentTerm && state.feedback?.kind === "incorrect" ? (
            <SpellIncorrectFeedback
              definition={currentTerm.definition}
              expectedAnswer={currentTerm.term}
              submittedAnswer={state.feedback.submittedAnswer}
              onContinue={handleBeginCorrection}
            />
          ) : currentTerm ? (
            <SpellPrompt
              answer={answer}
              definition={currentTerm.definition}
              inputRef={inputRef}
              isCorrect={state.feedback?.kind === "correct"}
              isCorrection={isCorrection}
              correctionError={state.correctionError}
              mastery={state.mastery[currentTerm.id] ?? 0}
              pronunciation={pronunciation}
              onAnswerChange={setAnswer}
              onSubmit={handleSubmit}
            />
          ) : (
            <InvalidSpellSession onRestart={handleRestart} />
          )}
        </main>
      </div>
    </div>
  );
}

interface SpellSidebarProps {
  moduleId: string;
  moduleTitle: string;
  state: SpellExerciseState;
  totalTermCount: number;
}

function SpellSidebar({
  moduleId,
  moduleTitle,
  state,
  totalTermCount,
}: SpellSidebarProps) {
  const overallProgress = state.completed
    ? 100
    : getSpellOverallProgress(state, totalTermCount);
  const stageTotal = state.completed
    ? state.history[state.history.length - 1]?.attempts.length ?? 0
    : state.queue.length;
  const stageCompleted = state.completed ? stageTotal : state.currentIndex;

  return (
    <aside className="study-status min-w-0 xl:sticky xl:top-[calc(var(--app-header-height)+1.25rem)] xl:self-start">
      <Link
        href={`/module/${moduleId}`}
        className="btn btn-ghost mb-4 justify-start gap-2 px-2 text-[var(--app-text-strong)]"
      >
        <span aria-hidden="true">←</span>
        Назад к модулю
      </Link>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex items-center gap-3 border-b border-[var(--app-divider)] pb-4">
          <SpellIcon />
          <div className="min-w-0">
            <p className="text-lg font-bold text-[var(--app-text-strong)]">
              spell
            </p>
            <p
              className="truncate text-sm text-[var(--app-text-muted)]"
              title={moduleTitle}
            >
              {moduleTitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-1 xl:gap-6">
          <SpellProgressStat
            label="Общий прогресс"
            value={overallProgress}
            max={100}
            valueLabel={`${overallProgress}%`}
            colorClass="progress-primary"
          />
          <SpellProgressStat
            label="Этот этап"
            value={stageCompleted}
            max={stageTotal}
            valueLabel={`${stageCompleted}/${stageTotal}`}
            colorClass="progress-success"
          />
        </div>
      </div>
    </aside>
  );
}

function SpellProgressStat({
  label,
  value,
  max,
  valueLabel,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  valueLabel: string;
  colorClass: string;
}) {
  return (
    <div className="min-w-0">
      <progress
        className={`progress ${colorClass} h-2 w-full`}
        value={value}
        max={Math.max(1, max)}
        aria-label={`${label}: ${valueLabel}`}
      />
      <div className="mt-1 flex flex-col text-xs sm:flex-row sm:justify-between sm:text-sm">
        <span className="truncate font-medium text-[var(--app-text-muted)]">
          {label}
        </span>
        <span className="font-bold text-[var(--app-text-strong)]">
          {valueLabel}
        </span>
      </div>
    </div>
  );
}

interface SpellPromptProps {
  answer: string;
  definition: string;
  inputRef: RefObject<HTMLInputElement | null>;
  isCorrect: boolean;
  isCorrection: boolean;
  correctionError: boolean;
  mastery: number;
  pronunciation: SpellPronunciationController;
  onAnswerChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function SpellPrompt({
  answer,
  definition,
  inputRef,
  isCorrect,
  isCorrection,
  correctionError,
  mastery,
  pronunciation,
  onAnswerChange,
  onSubmit,
}: SpellPromptProps) {
  const fieldStatus = isCorrect
    ? "Правильно"
    : isCorrection
      ? "Введите правильный ответ ещё раз"
      : "Ответ";

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-8 xl:min-h-[25rem]">
      <form onSubmit={onSubmit}>
        <div className="flex items-start gap-3">
          <button
            type="button"
            className={`btn btn-circle btn-ghost shrink-0 ${
              pronunciation.status === "error"
                ? "text-error"
                : "text-[var(--app-text-strong)]"
            }`}
            onClick={pronunciation.replay}
            disabled={pronunciation.status === "loading"}
            aria-label="Воспроизвести произношение ещё раз"
            title="Воспроизвести произношение ещё раз"
          >
            {pronunciation.status === "loading" ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <SpeakerIcon />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-4">
              <label htmlFor="spell-answer" className="sr-only">
                {isCorrection
                  ? "Введите правильный ответ ещё раз"
                  : "Введите, что слышите"}
              </label>
              <input
                ref={inputRef}
                id="spell-answer"
                type="text"
                className={`min-w-0 flex-1 border-x-0 border-t-0 border-b-2 bg-transparent px-0 pb-3 text-2xl text-[var(--app-text-strong)] outline-none transition-colors sm:text-3xl ${
                  isCorrect
                    ? "border-success"
                    : correctionError
                      ? "border-error"
                      : "border-[var(--app-border-strong)] focus:border-primary"
                }`}
                value={answer}
                placeholder={
                  isCorrection ? "Введите ответ ещё раз" : "Введите, что слышите"
                }
                onChange={(event) => onAnswerChange(event.target.value)}
                disabled={isCorrect}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
              />

              <MasteryDots value={mastery} />
            </div>

            <p
              className={`mt-2 text-sm font-bold uppercase tracking-wide ${
                isCorrect
                  ? "text-success"
                  : correctionError
                    ? "text-error"
                    : "text-[var(--app-text-muted)]"
              }`}
              role={isCorrect || correctionError ? "status" : undefined}
            >
              {correctionError
                ? "Ответ пока не совпадает"
                : fieldStatus}
            </p>
            <button type="submit" className="sr-only">
              Проверить ответ
            </button>
          </div>
        </div>

        {pronunciation.message && (
          <p
            className={`ml-14 mt-3 text-sm ${
              pronunciation.status === "error"
                ? "text-error"
                : "text-[var(--app-text-muted)]"
            }`}
            role={pronunciation.status === "error" ? "alert" : "status"}
          >
            {pronunciation.message}
          </p>
        )}

        <div className="mt-8 border-t border-[var(--app-divider)] pt-7 sm:mt-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
            Определение
          </p>
          <p className="break-words text-xl leading-relaxed text-[var(--app-text-strong)] sm:text-2xl">
            {definition}
          </p>
        </div>
      </form>
    </section>
  );
}

function MasteryDots({ value }: { value: number }) {
  return (
    <div
      className="mt-2 flex shrink-0 gap-2"
      aria-label={`Освоение термина: ${value} из ${SPELL_MASTERY_TARGET}`}
    >
      {Array.from({ length: SPELL_MASTERY_TARGET }, (_, index) => (
        <span
          key={index}
          className={`h-4 w-4 rounded-full border-2 ${
            index < value
              ? "border-success bg-success"
              : "border-[var(--app-border-strong)]"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function SpellIncorrectFeedback({
  definition,
  expectedAnswer,
  submittedAnswer,
  onContinue,
}: {
  definition: string;
  expectedAnswer: string;
  submittedAnswer: string;
  onContinue: () => void;
}) {
  const difference = getExpectedAnswerDifference(
    submittedAnswer,
    expectedAnswer,
  );

  return (
    <section className="rounded-2xl border border-error/40 bg-[var(--app-panel)] p-5 shadow-sm sm:p-8">
      <div className="mb-7 flex items-center gap-3 border-b border-[var(--app-divider)] pb-6 text-error" role="status">
        <span className="text-3xl" aria-hidden="true">×</span>
        <h1 className="text-2xl font-bold sm:text-3xl">Нужно исправить</h1>
      </div>

      <dl className="space-y-7">
        <div>
          <dt className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
            Определение
          </dt>
          <dd className="break-words text-lg text-[var(--app-text-strong)] sm:text-xl">
            {definition}
          </dd>
        </div>
        <div>
          <dt className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
            Ваш ответ
          </dt>
          <dd className="break-words text-lg font-semibold text-error">
            {submittedAnswer}
          </dd>
        </div>
        <div>
          <dt className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
            Правильный ответ
          </dt>
          <dd className="break-words text-2xl font-bold text-[var(--app-text-strong)]">
            {difference.map((segment, index) => (
              <span
                key={`${segment.text}-${index}`}
                className={segment.different ? "text-success" : undefined}
              >
                {segment.text}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <div className="mt-9 flex justify-end border-t border-[var(--app-divider)] pt-6">
        <button
          type="button"
          className="btn btn-primary min-w-40"
          onClick={onContinue}
          autoFocus
        >
          Продолжить
        </button>
      </div>
    </section>
  );
}

function SpellSummary({
  moduleId,
  state,
  terms,
  onRestart,
}: {
  moduleId: string;
  state: SpellExerciseState;
  terms: Term[];
  onRestart: () => void;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-success">
          Упражнение завершено
        </p>
        <h1 className="text-3xl font-bold text-[var(--app-text-strong)] sm:text-4xl">
          Все термины освоены
        </h1>
        <p className="mt-3 text-[var(--app-text-muted)]">
          Этапов пройдено: {state.history.length}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn btn-primary" onClick={onRestart}>
            Пройти заново
          </button>
          <Link href={`/module/${moduleId}`} className="btn btn-ghost">
            Вернуться к модулю
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-[var(--app-text-strong)] sm:text-2xl">
          Точность по этапам
        </h2>
        <div className="mt-7 flex h-52 items-end gap-3 border-b border-[var(--app-divider)] sm:gap-5">
          {state.history.map((stage) => {
            const accuracy = getSpellStageAccuracy(stage);

            return (
              <div
                key={stage.stageNumber}
                className="flex h-full min-w-0 flex-1 flex-col justify-end"
              >
                <p className="mb-2 text-center text-sm font-bold text-[var(--app-text-strong)]">
                  {accuracy}%
                </p>
                <div
                  className="min-h-1 rounded-t-lg bg-success"
                  style={{ height: `${Math.max(accuracy, 2)}%` }}
                  aria-label={`Этап ${stage.stageNumber}: ${accuracy}% правильных ответов`}
                />
              </div>
            );
          })}
        </div>
        <div
          className="mt-2 grid gap-3 text-center text-xs font-bold text-[var(--app-text-muted)] sm:gap-5 sm:text-sm"
          style={{
            gridTemplateColumns: `repeat(${state.history.length}, minmax(0, 1fr))`,
          }}
        >
          {state.history.map((stage) => (
            <span key={stage.stageNumber}>Этап {stage.stageNumber}</span>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] shadow-sm">
        <h2 className="border-b border-[var(--app-divider)] px-5 py-5 text-xl font-bold text-[var(--app-text-strong)] sm:px-8">
          Освоенные термины
        </h2>
        <div className="divide-y divide-[var(--app-divider)]">
          {terms.map((term) => (
            <div
              key={term.id}
              className="grid gap-3 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center sm:gap-8 sm:px-8"
            >
              <div className="flex min-w-0 items-center gap-3 font-semibold text-success">
                <span aria-hidden="true">✓</span>
                <span className="break-words text-[var(--app-text-strong)]">
                  {term.term}
                </span>
                <MasteryDots value={SPELL_MASTERY_TARGET} />
              </div>
              <p className="break-words text-[var(--app-text-muted)]">
                {term.definition}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptySpellExercise({
  moduleId,
  moduleTitle,
}: Pick<SpellExerciseProps, "moduleId" | "moduleTitle">) {
  return (
    <div className="mobile-study-page page-container px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-6 text-center shadow-sm sm:p-10">
        <SpellIcon centered />
        <h1 className="mt-5 text-3xl font-bold text-[var(--app-text-strong)]">
          В модуле пока нет терминов
        </h1>
        <p className="mt-3 text-[var(--app-text-muted)]">
          Добавьте термины в «{moduleTitle}», чтобы начать упражнение spell.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/module/${moduleId}/edit`} className="btn btn-primary">
            Добавить термины
          </Link>
          <Link href={`/module/${moduleId}`} className="btn btn-ghost">
            Вернуться к модулю
          </Link>
        </div>
      </section>
    </div>
  );
}

function InvalidSpellSession({ onRestart }: { onRestart: () => void }) {
  return (
    <section className="rounded-2xl border border-error/40 bg-[var(--app-panel)] p-6 text-center">
      <h1 className="text-2xl font-bold text-[var(--app-text-strong)]">
        Не удалось продолжить упражнение
      </h1>
      <p className="mt-2 text-[var(--app-text-muted)]">
        Начните новую попытку, чтобы восстановить корректный порядок терминов.
      </p>
      <button type="button" className="btn btn-primary mt-6" onClick={onRestart}>
        Начать заново
      </button>
    </section>
  );
}

type PronunciationStatus = "idle" | "loading" | "ready" | "error";

interface SpellPronunciationController {
  status: PronunciationStatus;
  message: string | null;
  replay: () => void;
}

interface ResolvedPronunciation {
  url: string;
  variant: PronunciationVariant;
}

function useSpellPronunciation(
  term: Term | null,
  shouldAutoPlay: boolean,
  promptKey: string,
): SpellPronunciationController {
  const [status, setStatus] = useState<PronunciationStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const cacheRef = useRef(
    new Map<string, Promise<ResolvedPronunciation>>(),
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestIdRef = useRef(0);

  const stopCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const resolvePronunciation = useCallback((word: string, retry: boolean) => {
    if (retry) {
      cacheRef.current.delete(word);
    }

    let lookup = cacheRef.current.get(word);

    if (!lookup) {
      lookup = lookupDictionary(word).then((result) =>
        selectPronunciation(result),
      );
      lookup.catch(() => cacheRef.current.delete(word));
      cacheRef.current.set(word, lookup);
    }

    return lookup;
  }, []);

  const play = useCallback(
    async (word: string, retry = false) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      stopCurrentAudio();
      setStatus("loading");
      setMessage(null);

      try {
        const pronunciation = await resolvePronunciation(word, retry);

        if (requestIdRef.current !== requestId) {
          return;
        }

        const audio = new Audio(pronunciation.url);
        audioRef.current = audio;
        await audio.play();

        if (requestIdRef.current === requestId) {
          setStatus("ready");
          setMessage(
            pronunciation.variant === getPronunciationVariantPreference()
              ? null
              : `Используется ${pronunciation.variant.toUpperCase()} произношение`,
          );
        }
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof PronunciationUnavailableError
            ? "Произношение не найдено. Можно продолжить по определению."
            : "Не удалось воспроизвести звук. Нажмите на динамик, чтобы повторить.",
        );
      }
    },
    [resolvePronunciation, stopCurrentAudio],
  );

  useEffect(() => {
    requestIdRef.current += 1;
    stopCurrentAudio();
    setStatus("idle");
    setMessage(null);

    if (term && shouldAutoPlay) {
      void play(term.term);
    }

    return () => {
      requestIdRef.current += 1;
      stopCurrentAudio();
    };
  }, [play, promptKey, shouldAutoPlay, stopCurrentAudio, term]);

  const replay = useCallback(() => {
    if (term) {
      void play(term.term, status === "error");
    }
  }, [play, status, term]);

  return { status, message, replay };
}

function selectPronunciation(
  result: DictionaryLookupResult,
): ResolvedPronunciation {
  const preferred = getPronunciationVariantPreference();
  const alternate = getAlternatePronunciationVariant(preferred);
  const variant = result.audio[preferred]
    ? preferred
    : result.audio[alternate]
      ? alternate
      : null;

  if (!variant) {
    throw new PronunciationUnavailableError();
  }

  return {
    variant,
    url: getPublicApiUrl(result.audio[variant]),
  };
}

class PronunciationUnavailableError extends Error {}

function SpellIcon({ centered = false }: { centered?: boolean }) {
  return (
    <span
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary ${
        centered ? "mx-auto" : ""
      }`}
      aria-hidden="true"
    >
      <SpeakerIcon />
    </span>
  );
}

function SpeakerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11 5 6 9H3v6h3l5 4V5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"
      />
    </svg>
  );
}
