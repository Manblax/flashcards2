"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  clearLearnSession,
  continueLearnExercise,
  createInitialLearnState,
  getLearnMasteryCount,
  getLearnMasteryTotal,
  getLearnProgress,
  getLearnStageTermIds,
  loadLearnSession,
  saveLearnSession,
  startNextLearnStage,
  submitLearnAnswer,
  type LearnAttempt,
  type LearnExerciseState,
  type LearnQuestion,
} from "@/lib/learn-exercise";
import type { Term } from "@/types/module";

const CORRECT_FEEDBACK_DELAY_MS = 750;

interface LearnExerciseProps {
  moduleId: string;
  moduleTitle: string;
  terms: Term[];
}

export default function LearnExercise({
  moduleId,
  moduleTitle,
  terms,
}: LearnExerciseProps) {
  const [state, setState] = useState<LearnExerciseState | null>(null);
  const [answer, setAnswer] = useState("");
  const [hintVisible, setHintVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const termsById = useMemo(
    () => new Map(terms.map((term) => [term.id, term])),
    [terms],
  );

  useEffect(() => {
    if (terms.length === 0) {
      return;
    }

    setState(
      loadLearnSession(sessionStorage, moduleId, terms) ??
        createInitialLearnState(terms),
    );
  }, [moduleId, terms]);

  useEffect(() => {
    if (state) {
      saveLearnSession(sessionStorage, moduleId, terms, state);
    }
  }, [moduleId, state, terms]);

  useEffect(() => {
    setAnswer("");
    setHintVisible(false);

    if (
      state &&
      !state.stageComplete &&
      state.queue[state.currentIndex]?.mode === "written"
    ) {
      inputRef.current?.focus();
    }
  }, [state?.currentIndex, state?.stageComplete, state?.stageNumber]);

  useEffect(() => {
    if (!state?.feedback?.isCorrect) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setState((current) =>
        current ? continueLearnExercise(current) : current,
      );
    }, CORRECT_FEEDBACK_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [state?.feedback]);

  const question =
    state && !state.stageComplete ? state.queue[state.currentIndex] : null;
  const currentTerm = question ? termsById.get(question.termId) ?? null : null;

  const submitAnswer = useCallback(
    (submittedAnswer: string, wasUnsure = false) => {
      if (!currentTerm) {
        return;
      }

      setState((current) =>
        current
          ? submitLearnAnswer(
              current,
              currentTerm,
              submittedAnswer,
              wasUnsure,
            )
          : current,
      );
    },
    [currentTerm],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !question ||
        question.mode !== "choice" ||
        state?.feedback ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }

      const optionIndex = Number(event.key) - 1;
      const optionId = question.optionTermIds[optionIndex];
      const option = optionId ? termsById.get(optionId) : null;

      if (option) {
        event.preventDefault();
        submitAnswer(option.term);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question, state?.feedback, submitAnswer, termsById]);

  if (terms.length === 0) {
    return (
      <EmptyLearnExercise moduleId={moduleId} moduleTitle={moduleTitle} />
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span
          className="loading loading-spinner loading-lg text-primary"
          aria-label="Загрузка упражнения learn"
        />
      </div>
    );
  }

  const handleWrittenSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (answer.trim()) {
      submitAnswer(answer);
    }
  };

  const handleContinue = () => {
    setState((current) =>
      current ? continueLearnExercise(current) : current,
    );
  };

  const handleNextStage = () => {
    setState((current) =>
      current ? startNextLearnStage(current, terms) : current,
    );
  };

  const handleRestart = () => {
    clearLearnSession(sessionStorage, moduleId);
    setAnswer("");
    setHintVisible(false);
    setState(createInitialLearnState(terms));
  };

  return (
    <div className="mobile-study-page page-container px-4 py-5 sm:px-6 sm:py-8">
      <main className="mx-auto max-w-6xl">
        <LearnHeader
          moduleId={moduleId}
          moduleTitle={moduleTitle}
          state={state}
          termCount={terms.length}
        />

        {state.stageComplete ? (
          <LearnCheckpoint
            moduleId={moduleId}
            state={state}
            termsById={termsById}
            termCount={terms.length}
            onContinue={handleNextStage}
            onRestart={handleRestart}
          />
        ) : question && currentTerm ? (
          <LearnQuestionCard
            answer={answer}
            feedback={state.feedback}
            hintVisible={hintVisible}
            inputRef={inputRef}
            question={question}
            term={currentTerm}
            termsById={termsById}
            onAnswerChange={setAnswer}
            onChoice={submitAnswer}
            onContinue={handleContinue}
            onHintToggle={() => setHintVisible((visible) => !visible)}
            onSubmit={handleWrittenSubmit}
            onUnsure={() => submitAnswer("", true)}
          />
        ) : (
          <InvalidLearnSession onRestart={handleRestart} />
        )}
      </main>
    </div>
  );
}

function LearnHeader({
  moduleId,
  moduleTitle,
  state,
  termCount,
}: {
  moduleId: string;
  moduleTitle: string;
  state: LearnExerciseState;
  termCount: number;
}) {
  const mastered = getLearnMasteryCount(state);
  const total = getLearnMasteryTotal(termCount);
  const progress = getLearnProgress(state, termCount);

  return (
    <header className="learn-header mb-6 sm:mb-8">
      <div className="mb-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <Link
          href={`/module/${moduleId}`}
          className="btn btn-circle btn-ghost text-[var(--app-text-strong)]"
          aria-label="Закрыть learn и вернуться к модулю"
        >
          <CloseIcon />
        </Link>
        <div className="min-w-0">
          <p className="font-bold text-[var(--app-text-strong)]">learn</p>
          <p
            className="truncate text-sm text-[var(--app-text-muted)]"
            title={moduleTitle}
          >
            {moduleTitle}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-[var(--app-text-muted)] sm:text-sm">
            Освоено
          </p>
          <p className="font-bold text-[var(--app-text-strong)]">
            {mastered}/{total}
          </p>
        </div>
      </div>

      <div className="relative">
        <progress
          className="progress progress-success h-3 w-full"
          value={progress}
          max={100}
          aria-label={`Общий прогресс: ${progress}%`}
        />
        {state.streak >= 5 && !state.stageComplete && (
          <div className="absolute -top-8 right-0 rounded-full bg-warning px-3 py-1 text-xs font-bold text-warning-content shadow-sm">
            <span aria-hidden="true">🔥 </span>
            {state.streak} подряд
          </div>
        )}
      </div>
    </header>
  );
}

function LearnQuestionCard({
  answer,
  feedback,
  hintVisible,
  inputRef,
  question,
  term,
  termsById,
  onAnswerChange,
  onChoice,
  onContinue,
  onHintToggle,
  onSubmit,
  onUnsure,
}: {
  answer: string;
  feedback: LearnAttempt | null;
  hintVisible: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  question: LearnQuestion;
  term: Term;
  termsById: Map<string, Term>;
  onAnswerChange: (value: string) => void;
  onChoice: (answer: string) => void;
  onContinue: () => void;
  onHintToggle: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUnsure: () => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-8 lg:min-h-[31rem]">
      <div className="mb-8 sm:mb-12">
        <div className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
          <span>Определение</span>
          <SpeakButton text={term.definition} />
        </div>
        <p className="max-w-4xl break-words text-xl leading-relaxed text-[var(--app-text-strong)] sm:text-2xl">
          {term.definition}
        </p>
      </div>

      {question.mode === "choice" ? (
        <ChoiceQuestion
          feedback={feedback}
          question={question}
          term={term}
          termsById={termsById}
          onChoice={onChoice}
        />
      ) : (
        <WrittenQuestion
          answer={answer}
          feedback={feedback}
          hintVisible={hintVisible}
          inputRef={inputRef}
          term={term}
          onAnswerChange={onAnswerChange}
          onHintToggle={onHintToggle}
          onSubmit={onSubmit}
        />
      )}

      <QuestionFooter
        feedback={feedback}
        onContinue={onContinue}
        onUnsure={onUnsure}
      />
    </section>
  );
}

function ChoiceQuestion({
  feedback,
  question,
  term,
  termsById,
  onChoice,
}: {
  feedback: LearnAttempt | null;
  question: LearnQuestion;
  term: Term;
  termsById: Map<string, Term>;
  onChoice: (answer: string) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm font-bold text-[var(--app-text-muted)]">
        Выберите ответ
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Варианты ответа">
        {question.optionTermIds.map((optionId, index) => {
          const option = termsById.get(optionId);

          if (!option) {
            return null;
          }

          const isCorrectOption = option.id === term.id;
          const isSelected = feedback?.submittedAnswer === option.term;
          const feedbackClass = feedback
            ? isCorrectOption
              ? "border-success bg-success/10 text-success"
              : isSelected
                ? "border-error bg-error/10 text-error"
                : "border-[var(--app-border)] opacity-60"
            : "border-[var(--app-border-strong,var(--app-border))] hover:border-primary hover:bg-primary/10";

          return (
            <button
              key={option.id}
              type="button"
              className={`learn-choice min-w-0 min-h-20 rounded-xl border-2 px-4 py-3 text-left transition-colors ${feedbackClass}`}
              onClick={() => onChoice(option.term)}
              disabled={Boolean(feedback)}
            >
              <span className="mr-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-base-300 text-sm font-bold text-[var(--app-text-muted)]">
                {feedback && isCorrectOption ? "✓" : index + 1}
              </span>
              <span className="break-words text-base font-medium sm:text-lg">
                {option.term}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WrittenQuestion({
  answer,
  feedback,
  hintVisible,
  inputRef,
  term,
  onAnswerChange,
  onHintToggle,
  onSubmit,
}: {
  answer: string;
  feedback: LearnAttempt | null;
  hintVisible: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  term: Term;
  onAnswerChange: (value: string) => void;
  onHintToggle: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const fieldClass = feedback
    ? feedback.isCorrect
      ? "border-success bg-success/10"
      : "border-error bg-error/10"
    : "border-[var(--app-field-border,var(--app-border-strong))] bg-[var(--app-field)] focus:border-primary focus:bg-[var(--app-field-focus)]";

  return (
    <form onSubmit={onSubmit}>
      <label
        htmlFor="learn-answer"
        className="mb-3 block text-sm font-bold text-[var(--app-text-muted)]"
      >
        Ваш ответ
      </label>
      <input
        ref={inputRef}
        id="learn-answer"
        type="text"
        className={`input input-lg h-16 w-full border-2 px-4 text-lg text-[var(--app-text-strong)] outline-none sm:text-xl ${fieldClass}`}
        value={answer}
        onChange={(event) => onAnswerChange(event.target.value)}
        disabled={Boolean(feedback)}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="Введите ответ"
      />

      {feedback && !feedback.isCorrect && (
        <div className="mt-4 rounded-xl border border-success/40 bg-success/10 p-4">
          <p className="text-sm font-medium text-[var(--app-text-muted)]">
            Правильный ответ
          </p>
          <p className="mt-1 break-words text-lg font-bold text-success">
            {term.term}
          </p>
        </div>
      )}

      {!feedback && (
        <div className="mt-3 min-h-7">
          {hintVisible ? (
            <p className="text-sm text-[var(--app-text-muted)]" role="status">
              Подсказка: <span className="font-bold text-[var(--app-text-strong)]">{getHint(term.term)}</span>
            </p>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm px-1 text-[var(--app-text-strong)]"
              onClick={onHintToggle}
            >
              Показать подсказку
            </button>
          )}
        </div>
      )}

      {!feedback && (
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="btn btn-primary min-w-32"
            disabled={!answer.trim()}
          >
            Ответить
          </button>
        </div>
      )}
    </form>
  );
}

function QuestionFooter({
  feedback,
  onContinue,
  onUnsure,
}: {
  feedback: LearnAttempt | null;
  onContinue: () => void;
  onUnsure: () => void;
}) {
  if (!feedback) {
    return (
      <div className="mt-6 flex justify-end border-t border-[var(--app-divider)] pt-5">
        <button
          type="button"
          className="btn btn-ghost gap-2 text-[var(--app-text-muted)]"
          onClick={onUnsure}
        >
          <FlagIcon />
          Не уверен?
        </button>
      </div>
    );
  }

  return (
    <div
      className={`mt-6 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        feedback.isCorrect
          ? "border-success/40 bg-success/10"
          : "border-error/40 bg-error/10"
      }`}
      role="status"
    >
      <div>
        <p
          className={`text-lg font-bold ${feedback.isCorrect ? "text-success" : "text-error"}`}
        >
          {feedback.isCorrect ? "Верно!" : "Пока не получилось"}
        </p>
        {!feedback.isCorrect && (
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">
            Правильный ответ отмечен выше.
          </p>
        )}
      </div>
      {feedback.isCorrect ? (
        <span className="loading loading-dots loading-sm text-success" aria-label="Следующий вопрос" />
      ) : (
        <button
          type="button"
          className="btn btn-primary sm:min-w-32"
          onClick={onContinue}
        >
          Продолжить
        </button>
      )}
    </div>
  );
}

function LearnCheckpoint({
  moduleId,
  state,
  termsById,
  termCount,
  onContinue,
  onRestart,
}: {
  moduleId: string;
  state: LearnExerciseState;
  termsById: Map<string, Term>;
  termCount: number;
  onContinue: () => void;
  onRestart: () => void;
}) {
  const progress = getLearnProgress(state, termCount);
  const stage = state.history[state.history.length - 1];
  const correctCount = stage?.attempts.filter((attempt) => attempt.isCorrect).length ?? 0;
  const stageTermIds = getLearnStageTermIds(state);

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-8">
      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-success">
        {state.completed ? "Готово" : `Этап ${state.stageNumber} завершён`}
      </p>
      <h1 className="text-2xl font-bold text-[var(--app-text-strong)] sm:text-4xl">
        {state.completed
          ? "Все термины освоены!"
          : "Так держать, у вас всё получится!"}
      </h1>

      <div className="my-7 rounded-xl bg-base-300/60 p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="font-medium text-[var(--app-text-muted)]">
            Общий прогресс по модулю
          </span>
          <span className="font-bold text-success">{progress}%</span>
        </div>
        <progress
          className="progress progress-success h-3 w-full"
          value={progress}
          max={100}
          aria-label={`Прогресс по модулю: ${progress}%`}
        />
        <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:max-w-sm sm:text-left">
          <div>
            <p className="text-2xl font-bold text-success">{correctCount}</p>
            <p className="text-sm text-[var(--app-text-muted)]">Правильно</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">
              {(stage?.attempts.length ?? 0) - correctCount}
            </p>
            <p className="text-sm text-[var(--app-text-muted)]">Повторить</p>
          </div>
        </div>
      </div>

      {stageTermIds.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-[var(--app-text-strong)]">
            Термины, изученные на этом этапе
          </h2>
          <div className="space-y-3">
            {stageTermIds.map((termId) => {
              const term = termsById.get(termId);

              return term ? (
                <div
                  key={term.id}
                  className="grid gap-2 rounded-xl border border-[var(--app-border)] bg-base-200 p-4 sm:grid-cols-[minmax(0,1fr)_2fr] sm:gap-6"
                >
                  <p className="break-words font-bold text-[var(--app-text-strong)]">
                    {term.term}
                  </p>
                  <p className="break-words text-[var(--app-text-muted)]">
                    {term.definition}
                  </p>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={`/module/${moduleId}`} className="btn btn-ghost">
          Назад к модулю
        </Link>
        <button
          type="button"
          className="btn btn-primary sm:min-w-40"
          onClick={state.completed ? onRestart : onContinue}
        >
          {state.completed ? "Пройти заново" : "Продолжить"}
        </button>
      </div>
    </section>
  );
}

function EmptyLearnExercise({
  moduleId,
  moduleTitle,
}: {
  moduleId: string;
  moduleTitle: string;
}) {
  return (
    <div className="mobile-study-page page-container px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-6 text-center shadow-sm sm:p-10">
        <LearnIcon />
        <p className="mt-4 text-sm font-bold uppercase tracking-wide text-primary">
          learn · {moduleTitle}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--app-text-strong)]">
          В модуле пока нет терминов
        </h1>
        <p className="mt-3 text-[var(--app-text-muted)]">
          Добавьте хотя бы один термин, чтобы начать обучение.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
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

function InvalidLearnSession({ onRestart }: { onRestart: () => void }) {
  return (
    <section className="rounded-2xl border border-error/40 bg-error/10 p-6 text-center">
      <h1 className="text-xl font-bold text-[var(--app-text-strong)]">
        Не удалось продолжить упражнение
      </h1>
      <p className="mt-2 text-[var(--app-text-muted)]">
        Начните сессию заново — термины модуля останутся без изменений.
      </p>
      <button type="button" className="btn btn-primary mt-5" onClick={onRestart}>
        Начать заново
      </button>
    </section>
  );
}

function SpeakButton({ text }: { text: string }) {
  const speak = () => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      className="btn btn-circle btn-ghost btn-sm text-[var(--app-text-muted)]"
      onClick={speak}
      aria-label="Прослушать определение"
    >
      <SpeakerIcon />
    </button>
  );
}

function getHint(value: string) {
  const characters = Array.from(value.trim());

  if (characters.length <= 1) {
    return characters.join("");
  }

  return `${characters[0]}${" •".repeat(characters.length - 1)}`;
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function LearnIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto h-12 w-12 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M12 6.25v13m0-13C10.83 5.48 9.25 5 7.5 5S4.17 5.48 3 6.25v13C4.17 18.48 5.75 18 7.5 18s3.33.48 4.5 1.25m0-13C13.17 5.48 14.75 5 16.5 5s3.33.48 4.5 1.25v13C19.83 18.48 18.25 18 16.5 18s-3.33.48-4.5 1.25"
      />
    </svg>
  );
}

function CloseIcon() {
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
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
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
        d="M11 5 6 9H3v6h3l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"
      />
    </svg>
  );
}

function FlagIcon() {
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
        d="M5 21V5m0 0c5-3 8 3 14 0v9c-6 3-9-3-14 0"
      />
    </svg>
  );
}
