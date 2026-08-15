"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";

import {
  clearWriteSession,
  continueWriteExercise,
  createInitialWriteState,
  loadWriteSession,
  overrideWriteAnswer,
  saveWriteSession,
  submitWriteAnswer,
  type WriteExerciseState,
} from "@/lib/write-exercise";
import type { Term } from "@/types/module";

interface WriteExerciseProps {
  moduleId: string;
  moduleTitle: string;
  terms: Term[];
}

export default function WriteExercise({
  moduleId,
  moduleTitle,
  terms,
}: WriteExerciseProps) {
  const [state, setState] = useState<WriteExerciseState | null>(null);
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

    const restoredState = loadWriteSession(sessionStorage, moduleId, terms);
    setState(restoredState ?? createInitialWriteState(terms));
  }, [moduleId, terms]);

  useEffect(() => {
    if (state) {
      saveWriteSession(sessionStorage, moduleId, terms, state);
    }
  }, [moduleId, state, terms]);

  useEffect(() => {
    if (state && !state.completed && !state.feedback) {
      setAnswer("");
      inputRef.current?.focus();
    }
  }, [state]);

  if (terms.length === 0) {
    return (
      <EmptyWriteExercise moduleId={moduleId} moduleTitle={moduleTitle} />
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span
          className="loading loading-spinner loading-lg text-primary"
          aria-label="Загрузка упражнения"
        />
      </div>
    );
  }

  const currentTerm = state.completed
    ? null
    : termsById.get(state.queue[state.currentIndex]) ?? null;

  const submitAnswer = (wasSkipped: boolean) => {
    setState((current) => {
      if (!current) {
        return current;
      }

      const term = termsById.get(current.queue[current.currentIndex]);

      if (!term) {
        return current;
      }

      return submitWriteAnswer(current, term, answer, wasSkipped);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (answer.trim()) {
      submitAnswer(false);
    }
  };

  const handleContinue = () => {
    setState((current) =>
      current ? continueWriteExercise(current, terms.length) : current,
    );
  };

  const handleOverride = () => {
    setState((current) => (current ? overrideWriteAnswer(current) : current));
  };

  const handleRestart = () => {
    clearWriteSession(sessionStorage, moduleId);
    setAnswer("");
    setState(createInitialWriteState(terms));
  };

  return (
    <div className="container mx-auto px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <WriteSidebar
          moduleId={moduleId}
          moduleTitle={moduleTitle}
          state={state}
          totalTermCount={terms.length}
        />

        <main className="min-w-0">
          {state.completed ? (
            <WriteSummary
              moduleId={moduleId}
              state={state}
              termsById={termsById}
              onRestart={handleRestart}
            />
          ) : currentTerm && state.feedback ? (
            <WriteFeedback
              definition={currentTerm.definition}
              expectedAnswer={currentTerm.term}
              state={state}
              onContinue={handleContinue}
              onOverride={handleOverride}
            />
          ) : currentTerm ? (
            <WritePrompt
              answer={answer}
              definition={currentTerm.definition}
              inputRef={inputRef}
              onAnswerChange={setAnswer}
              onSkip={() => submitAnswer(true)}
              onSubmit={handleSubmit}
              stageNumber={state.stageNumber}
            />
          ) : (
            <InvalidSession onRestart={handleRestart} />
          )}
        </main>
      </div>
    </div>
  );
}

interface WriteSidebarProps {
  moduleId: string;
  moduleTitle: string;
  state: WriteExerciseState;
  totalTermCount: number;
}

function WriteSidebar({
  moduleId,
  moduleTitle,
  state,
  totalTermCount,
}: WriteSidebarProps) {
  const stageTotal = state.completed ? totalTermCount : state.queue.length;
  const remaining = state.completed
    ? 0
    : Math.max(
        0,
        state.queue.length -
          state.currentIndex -
          (state.feedback === null ? 0 : 1),
      );
  const correct = state.completed ? totalTermCount : state.correctCount;
  const incorrect = state.completed ? 0 : state.incorrectCount;

  return (
    <aside className="min-w-0 lg:sticky lg:top-5 lg:self-start">
      <Link
        href={`/module/${moduleId}`}
        className="btn btn-ghost mb-4 justify-start gap-2 px-2 text-[var(--app-text-strong)]"
      >
        <span aria-hidden="true">←</span>
        Назад к модулю
      </Link>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex items-center gap-3 border-b border-[var(--app-divider)] pb-4">
          <WriteIcon />
          <div className="min-w-0">
            <p className="text-lg font-bold text-[var(--app-text-strong)]">
              write
            </p>
            <p
              className="truncate text-sm text-[var(--app-text-muted)]"
              title={moduleTitle}
            >
              {moduleTitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-5">
          <ProgressStat
            colorClass="progress-primary"
            label="Осталось"
            max={stageTotal}
            value={remaining}
          />
          <ProgressStat
            colorClass="progress-error"
            label="Неправильно"
            max={stageTotal}
            value={incorrect}
          />
          <ProgressStat
            colorClass="progress-success"
            label="Правильно"
            max={stageTotal}
            value={correct}
          />
        </div>
      </div>
    </aside>
  );
}

interface ProgressStatProps {
  colorClass: string;
  label: string;
  max: number;
  value: number;
}

function ProgressStat({ colorClass, label, max, value }: ProgressStatProps) {
  return (
    <div className="min-w-0">
      <progress
        className={`progress ${colorClass} h-2 w-full`}
        value={value}
        max={Math.max(1, max)}
        aria-label={`${label}: ${value}`}
      />
      <div className="mt-1 flex flex-col text-xs sm:flex-row sm:justify-between sm:text-sm">
        <span className="truncate font-medium text-[var(--app-text-muted)]">
          {label}
        </span>
        <span className="font-bold text-[var(--app-text-strong)]">{value}</span>
      </div>
    </div>
  );
}

interface WritePromptProps {
  answer: string;
  definition: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onAnswerChange: (value: string) => void;
  onSkip: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  stageNumber: number;
}

function WritePrompt({
  answer,
  definition,
  inputRef,
  onAnswerChange,
  onSkip,
  onSubmit,
  stageNumber,
}: WritePromptProps) {
  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-8 lg:min-h-[28rem]">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--app-divider)] pb-7">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">
            Этап {stageNumber}
          </p>
          <h1 className="text-2xl font-bold text-[var(--app-text-strong)] sm:text-3xl">
            Напишите термин
          </h1>
        </div>
        <button
          type="button"
          className="btn btn-ghost px-2 text-accent hover:bg-transparent"
          onClick={onSkip}
        >
          Не знаю
        </button>
      </div>

      <div className="mb-10">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
          Определение
        </p>
        <p className="break-words text-xl leading-relaxed text-[var(--app-text-strong)] sm:text-2xl">
          {definition}
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <label
          htmlFor="write-answer"
          className="mb-2 block text-sm font-bold uppercase tracking-wide text-[var(--app-text-muted)]"
        >
          Введите ответ
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input
            ref={inputRef}
            id="write-answer"
            type="text"
            className="input input-lg min-w-0 flex-1 border-x-0 border-t-0 border-b-2 border-[var(--app-field-border,var(--app-border-strong))] bg-[var(--app-field)] px-3 text-[var(--app-text-strong)] outline-none focus:border-primary focus:bg-[var(--app-field-focus)]"
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary btn-lg sm:min-w-36"
            disabled={!answer.trim()}
          >
            Ответить
          </button>
        </div>
      </form>
    </section>
  );
}

interface WriteFeedbackProps {
  definition: string;
  expectedAnswer: string;
  state: WriteExerciseState;
  onContinue: () => void;
  onOverride: () => void;
}

function WriteFeedback({
  definition,
  expectedAnswer,
  state,
  onContinue,
  onOverride,
}: WriteFeedbackProps) {
  const feedback = state.feedback;

  if (!feedback) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-8">
      <div
        className={`mb-7 flex items-center gap-3 border-b border-[var(--app-divider)] pb-6 ${
          feedback.isCorrect ? "text-success" : "text-error"
        }`}
        role="status"
      >
        <span className="text-3xl" aria-hidden="true">
          {feedback.isCorrect ? "✓" : "×"}
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {feedback.isCorrect ? "Верно!" : "Нужно повторить"}
        </h1>
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
          <dd
            className={`break-words text-lg font-semibold ${
              feedback.isCorrect ? "text-success" : "text-error"
            }`}
          >
            {feedback.wasSkipped ? "Нет ответа" : feedback.submittedAnswer}
          </dd>
        </div>
        <div>
          <dt className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
            Правильный ответ
          </dt>
          <dd className="break-words text-xl font-bold text-[var(--app-text-strong)] sm:text-2xl">
            {expectedAnswer}
          </dd>
        </div>
      </dl>

      <div className="mt-9 flex flex-col-reverse gap-3 border-t border-[var(--app-divider)] pt-6 sm:flex-row sm:justify-end">
        {!feedback.isCorrect && (
          <button
            type="button"
            className="btn btn-ghost text-accent"
            onClick={onOverride}
          >
            Я ответил правильно
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary sm:min-w-40"
          onClick={onContinue}
          autoFocus
        >
          Продолжить
        </button>
      </div>
    </section>
  );
}

interface WriteSummaryProps {
  moduleId: string;
  state: WriteExerciseState;
  termsById: Map<string, Term>;
  onRestart: () => void;
}

function WriteSummary({
  moduleId,
  state,
  termsById,
  onRestart,
}: WriteSummaryProps) {
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

      {state.history.map((stage) => {
        const correctCount = stage.answers.filter(
          (answerResult) => answerResult.isCorrect,
        ).length;
        const percentage = Math.round(
          (correctCount / stage.answers.length) * 100,
        );

        return (
          <section
            key={stage.stageNumber}
            className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-8"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-[var(--app-divider)] pb-5">
              <h2 className="text-2xl font-bold text-[var(--app-text-strong)]">
                Этап {stage.stageNumber}
              </h2>
              <p className="font-bold text-[var(--app-text-muted)]">
                {correctCount}/{stage.answers.length} — {percentage}%
              </p>
            </div>

            <div className="divide-y divide-[var(--app-divider)]">
              {stage.answers.map((answerResult) => {
                const term = termsById.get(answerResult.termId);

                if (!term) {
                  return null;
                }

                return (
                  <div
                    key={answerResult.termId}
                    className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6"
                  >
                    <div
                      className={`flex min-w-0 items-start gap-3 font-semibold ${
                        answerResult.isCorrect ? "text-success" : "text-error"
                      }`}
                    >
                      <span aria-hidden="true">
                        {answerResult.isCorrect ? "✓" : "×"}
                      </span>
                      <span className="break-words">{term.term}</span>
                    </div>
                    <p className="break-words text-[var(--app-text-muted)]">
                      {term.definition}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EmptyWriteExercise({
  moduleId,
  moduleTitle,
}: Pick<WriteExerciseProps, "moduleId" | "moduleTitle">) {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-6 text-center shadow-sm sm:p-10">
        <WriteIcon centered />
        <h1 className="mt-5 text-3xl font-bold text-[var(--app-text-strong)]">
          В модуле пока нет терминов
        </h1>
        <p className="mt-3 text-[var(--app-text-muted)]">
          Добавьте термины в «{moduleTitle}», чтобы начать упражнение write.
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

function InvalidSession({ onRestart }: { onRestart: () => void }) {
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

function WriteIcon({ centered = false }: { centered?: boolean }) {
  return (
    <span
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary ${
        centered ? "mx-auto" : ""
      }`}
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 20h9"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16.5 3.5a2.121 2.121 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
        />
      </svg>
    </span>
  );
}
