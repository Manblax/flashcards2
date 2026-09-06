"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  answerTestQuestion,
  canSubmitTest,
  clearTestSession,
  createDefaultTestSettings,
  createTestExerciseState,
  getAnsweredTestQuestionCount,
  getTestExpectedAnswer,
  getTestPrompt,
  getTestQuestionResults,
  getTestScore,
  loadTestSession,
  saveTestSession,
  submitTestExercise,
  type TestAnswerWith,
  type TestExerciseState,
  type TestQuestion,
  type TestQuestionResult,
  type TestSettings,
  type TestTypeSettings,
} from "@/lib/test-exercise";
import type { Term } from "@/types/module";

interface TestExerciseProps {
  moduleId: string;
  moduleTitle: string;
  terms: Term[];
}

export default function TestExercise({
  moduleId,
  moduleTitle,
  terms,
}: TestExerciseProps) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<TestExerciseState | null>(null);
  const [settings, setSettings] = useState<TestSettings>(() =>
    createDefaultTestSettings(terms),
  );
  const termsById = useMemo(
    () => new Map(terms.map((term) => [term.id, term])),
    [terms],
  );

  useEffect(() => {
    if (terms.length > 0) {
      setState(loadTestSession(sessionStorage, moduleId, terms));
      setSettings(createDefaultTestSettings(terms));
    }
    setReady(true);
  }, [moduleId, terms]);

  useEffect(() => {
    if (state) {
      saveTestSession(sessionStorage, moduleId, terms, state);
    }
  }, [moduleId, state, terms]);

  if (terms.length === 0) {
    return <EmptyTestExercise moduleId={moduleId} moduleTitle={moduleTitle} />;
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span
          className="loading loading-spinner loading-lg text-primary"
          aria-label="Загрузка упражнения test"
        />
      </div>
    );
  }

  const startTest = () => {
    setState(createTestExerciseState(terms, settings));
  };

  const answerQuestion = (questionId: string, answer: string) => {
    setState((current) =>
      current
        ? answerTestQuestion(current, questionId, answer)
        : current,
    );
  };

  const finishTest = () => {
    setState((current) => (current ? submitTestExercise(current) : current));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const retakeTest = () => {
    if (!state) {
      return;
    }

    clearTestSession(sessionStorage, moduleId);
    setState(createTestExerciseState(terms, state.settings));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const createNewTest = () => {
    clearTestSession(sessionStorage, moduleId);
    setState(null);
    setSettings(createDefaultTestSettings(terms));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!state) {
    return (
      <TestSetup
        moduleId={moduleId}
        moduleTitle={moduleTitle}
        settings={settings}
        termCount={terms.length}
        onSettingsChange={setSettings}
        onStart={startTest}
      />
    );
  }

  if (state.submitted) {
    return (
      <TestResults
        moduleId={moduleId}
        moduleTitle={moduleTitle}
        state={state}
        terms={terms}
        termsById={termsById}
        onNewTest={createNewTest}
        onRetake={retakeTest}
      />
    );
  }

  return (
    <ActiveTest
      moduleId={moduleId}
      moduleTitle={moduleTitle}
      state={state}
      termsById={termsById}
      onAnswer={answerQuestion}
      onFinish={finishTest}
    />
  );
}

function TestSetup({
  moduleId,
  moduleTitle,
  settings,
  termCount,
  onSettingsChange,
  onStart,
}: {
  moduleId: string;
  moduleTitle: string;
  settings: TestSettings;
  termCount: number;
  onSettingsChange: (settings: TestSettings) => void;
  onStart: () => void;
}) {
  const enabledTypeCount = Object.values(settings.types).filter(Boolean).length;
  const setType = (key: keyof TestTypeSettings, value: boolean) => {
    onSettingsChange({
      ...settings,
      types: { ...settings.types, [key]: value },
    });
  };

  return (
    <div className="page-container px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/module/${moduleId}`}
          className="btn btn-ghost mb-4 gap-2 px-2 text-[var(--app-text-strong)]"
        >
          <span aria-hidden="true">←</span>
          Назад к модулю
        </Link>

        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-lg sm:p-8">
          <div className="mb-8 flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="mb-2 truncate text-sm font-bold text-primary" title={moduleTitle}>
                {moduleTitle}
              </p>
              <h1 className="text-3xl font-bold text-[var(--app-text-strong)] sm:text-4xl">
                Настройте свой test
              </h1>
            </div>
            <TestIcon />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 border-b border-[var(--app-divider)] pb-6 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center">
              <label htmlFor="test-question-count" className="font-bold text-[var(--app-text-strong)]">
                Вопросы <span className="font-normal text-[var(--app-text-muted)]">(максимум {termCount})</span>
              </label>
              <input
                id="test-question-count"
                type="number"
                className="input w-full border-[var(--app-field-border,var(--app-border))] bg-[var(--app-field)] text-[var(--app-text-strong)]"
                min={1}
                max={termCount}
                value={settings.questionCount}
                onChange={(event) =>
                  onSettingsChange({
                    ...settings,
                    questionCount: clampQuestionCount(
                      Number(event.target.value),
                      termCount,
                    ),
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-3 border-b border-[var(--app-divider)] pb-6 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center">
              <label htmlFor="test-answer-with" className="font-bold text-[var(--app-text-strong)]">
                В качестве ответа
              </label>
              <select
                id="test-answer-with"
                className="select w-full border-[var(--app-field-border,var(--app-border))] bg-[var(--app-field)] text-[var(--app-text-strong)]"
                value={settings.answerWith}
                onChange={(event) =>
                  onSettingsChange({
                    ...settings,
                    answerWith: event.target.value as TestAnswerWith,
                  })
                }
              >
                <option value="term">Термин</option>
                <option value="definition">Определение</option>
              </select>
            </div>

            <div className="space-y-1">
              <TypeToggle
                checked={settings.types.trueFalse}
                label="Верно — неверно"
                onChange={(checked) => setType("trueFalse", checked)}
              />
              <TypeToggle
                checked={settings.types.choice}
                label="Вопросы с выбором ответа"
                onChange={(checked) => setType("choice", checked)}
              />
              <TypeToggle
                checked={settings.types.matching}
                disabled={termCount < 2}
                label="Сопоставление"
                onChange={(checked) => setType("matching", checked)}
              />
              <TypeToggle
                checked={settings.types.written}
                label="Письменные вопросы"
                onChange={(checked) => setType("written", checked)}
              />
            </div>
          </div>

          {enabledTypeCount === 0 && (
            <p className="mt-5 text-sm font-medium text-error" role="alert">
              Выберите хотя бы один тип вопросов.
            </p>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="btn btn-primary min-w-36"
              onClick={onStart}
              disabled={enabledTypeCount === 0}
            >
              Начать test
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function TypeToggle({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex min-h-14 items-center justify-between gap-4 rounded-xl px-3 ${disabled ? "opacity-50" : "cursor-pointer hover:bg-base-200"}`}>
      <span className="font-medium text-[var(--app-text-strong)]">{label}</span>
      <input
        type="checkbox"
        className="toggle toggle-primary"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function ActiveTest({
  moduleId,
  moduleTitle,
  state,
  termsById,
  onAnswer,
  onFinish,
}: {
  moduleId: string;
  moduleTitle: string;
  state: TestExerciseState;
  termsById: Map<string, Term>;
  onAnswer: (questionId: string, answer: string) => void;
  onFinish: () => void;
}) {
  const answered = getAnsweredTestQuestionCount(state);
  const total = state.questions.length;
  const renderedMatchingGroups = new Set<string>();

  return (
    <div className="pb-12">
      <TestHeader
        answered={answered}
        moduleId={moduleId}
        moduleTitle={moduleTitle}
        total={total}
      />

      <main className="page-container px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="mx-auto max-w-5xl space-y-5">
          {state.questions.map((question, index) => {
            if (question.type === "matching" && question.matchingGroupId) {
              if (renderedMatchingGroups.has(question.matchingGroupId)) {
                return null;
              }

              renderedMatchingGroups.add(question.matchingGroupId);
              const groupQuestions = state.questions.filter(
                (candidate) =>
                  candidate.matchingGroupId === question.matchingGroupId,
              );

              return (
                <MatchingQuestionCard
                  key={question.matchingGroupId}
                  answerWith={state.settings.answerWith}
                  answers={state.answers}
                  firstNumber={index + 1}
                  questions={groupQuestions}
                  termsById={termsById}
                  total={total}
                  onAnswer={onAnswer}
                />
              );
            }

            return (
              <QuestionCard
                key={question.id}
                answer={state.answers[question.id] ?? ""}
                answerWith={state.settings.answerWith}
                number={index + 1}
                question={question}
                termsById={termsById}
                total={total}
                onAnswer={onAnswer}
              />
            );
          })}

          <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-[var(--app-text-strong)]">
                  {answered === total
                    ? "Все ответы заполнены"
                    : `Осталось ответить: ${total - answered}`}
                </p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">
                  После завершения изменить ответы будет нельзя.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary sm:min-w-44"
                onClick={onFinish}
                disabled={!canSubmitTest(state)}
              >
                Завершить test
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function TestHeader({
  answered,
  moduleId,
  moduleTitle,
  total,
}: {
  answered: number;
  moduleId: string;
  moduleTitle: string;
  total: number;
}) {
  const progress = total === 0 ? 0 : Math.round((answered / total) * 100);

  return (
    <header className="sticky top-[var(--app-header-height)] z-30 border-b border-[var(--app-border)] bg-base-100/95 shadow-sm backdrop-blur">
      <div className="page-container grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href={`/module/${moduleId}`}
          className="btn btn-circle btn-ghost text-[var(--app-text-strong)]"
          aria-label="Закрыть test и вернуться к модулю"
        >
          <CloseIcon />
        </Link>
        <div className="min-w-0 text-center">
          <p className="font-bold text-[var(--app-text-strong)]">
            {answered} / {total}
          </p>
          <p className="truncate text-xs text-[var(--app-text-muted)]" title={moduleTitle}>
            {moduleTitle}
          </p>
        </div>
        <span className="w-12 text-right text-sm font-bold text-primary">
          {progress}%
        </span>
      </div>
      <progress
        className="progress progress-primary block h-1 w-full rounded-none"
        value={answered}
        max={Math.max(1, total)}
        aria-label={`Заполнено вопросов: ${answered} из ${total}`}
      />
    </header>
  );
}

function QuestionCard({
  answer,
  answerWith,
  number,
  question,
  termsById,
  total,
  onAnswer,
}: {
  answer: string;
  answerWith: TestAnswerWith;
  number: number;
  question: TestQuestion;
  termsById: Map<string, Term>;
  total: number;
  onAnswer: (questionId: string, answer: string) => void;
}) {
  const term = termsById.get(question.termId);

  if (!term) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-7">
      <QuestionLabel number={number} total={total} />

      {question.type === "true-false" ? (
        <TrueFalseQuestion
          answer={answer}
          answerWith={answerWith}
          question={question}
          term={term}
          termsById={termsById}
          onAnswer={onAnswer}
        />
      ) : question.type === "choice" ? (
        <ChoiceTestQuestion
          answer={answer}
          answerWith={answerWith}
          question={question}
          term={term}
          termsById={termsById}
          onAnswer={onAnswer}
        />
      ) : (
        <WrittenTestQuestion
          answer={answer}
          answerWith={answerWith}
          question={question}
          term={term}
          onAnswer={onAnswer}
        />
      )}
    </section>
  );
}

function QuestionLabel({ number, total }: { number: number; total: number }) {
  return (
    <p className="mb-5 text-right text-sm font-medium text-[var(--app-text-muted)]">
      {number} из {total}
    </p>
  );
}

function TrueFalseQuestion({
  answer,
  answerWith,
  question,
  term,
  termsById,
  onAnswer,
}: {
  answer: string;
  answerWith: TestAnswerWith;
  question: TestQuestion;
  term: Term;
  termsById: Map<string, Term>;
  onAnswer: (questionId: string, answer: string) => void;
}) {
  const shownTerm = question.shownTermId
    ? termsById.get(question.shownTermId)
    : null;

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-0">
        <PromptBlock
          label={answerWith === "term" ? "Определение" : "Термин"}
          text={getTestPrompt(term, answerWith)}
        />
        <div className="sm:border-l sm:border-[var(--app-divider)] sm:pl-6">
          <p className="mb-4 text-sm font-bold text-[var(--app-text-muted)]">
            {answerWith === "term" ? "Термин" : "Определение"}
          </p>
          <p className="break-words text-xl text-[var(--app-text-strong)]">
            {shownTerm ? getTestExpectedAnswer(shownTerm, answerWith) : "—"}
          </p>
        </div>
      </div>
      <div className="mt-8 grid gap-3 border-t border-[var(--app-divider)] pt-6 sm:grid-cols-2">
        <AnswerButton active={answer === "true"} onClick={() => onAnswer(question.id, "true")}>
          Верно
        </AnswerButton>
        <AnswerButton active={answer === "false"} onClick={() => onAnswer(question.id, "false")}>
          Неверно
        </AnswerButton>
      </div>
    </div>
  );
}

function ChoiceTestQuestion({
  answer,
  answerWith,
  question,
  term,
  termsById,
  onAnswer,
}: {
  answer: string;
  answerWith: TestAnswerWith;
  question: TestQuestion;
  term: Term;
  termsById: Map<string, Term>;
  onAnswer: (questionId: string, answer: string) => void;
}) {
  return (
    <div>
      <PromptBlock
        label={answerWith === "term" ? "Определение" : "Термин"}
        text={getTestPrompt(term, answerWith)}
      />
      <p className="mb-3 mt-8 text-sm font-bold text-[var(--app-text-muted)]">
        Выберите ответ
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.optionTermIds.map((optionTermId) => {
          const optionTerm = termsById.get(optionTermId);

          return optionTerm ? (
            <AnswerButton
              key={optionTerm.id}
              active={answer === optionTerm.id}
              onClick={() => onAnswer(question.id, optionTerm.id)}
            >
              {getTestExpectedAnswer(optionTerm, answerWith)}
            </AnswerButton>
          ) : null;
        })}
      </div>
    </div>
  );
}

function WrittenTestQuestion({
  answer,
  answerWith,
  question,
  term,
  onAnswer,
}: {
  answer: string;
  answerWith: TestAnswerWith;
  question: TestQuestion;
  term: Term;
  onAnswer: (questionId: string, answer: string) => void;
}) {
  return (
    <div>
      <PromptBlock
        label={answerWith === "term" ? "Определение" : "Термин"}
        text={getTestPrompt(term, answerWith)}
      />
      <label htmlFor={`test-answer-${question.id}`} className="mb-3 mt-8 block text-sm font-bold text-[var(--app-text-muted)]">
        Ваш ответ
      </label>
      <input
        id={`test-answer-${question.id}`}
        type="text"
        className="input input-lg h-16 w-full border-2 border-[var(--app-field-border,var(--app-border-strong))] bg-[var(--app-field)] px-4 text-lg text-[var(--app-text-strong)] outline-none focus:border-primary focus:bg-[var(--app-field-focus)]"
        value={answer}
        onChange={(event) => onAnswer(question.id, event.target.value)}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="Введите ответ"
      />
    </div>
  );
}

function MatchingQuestionCard({
  answerWith,
  answers,
  firstNumber,
  questions,
  termsById,
  total,
  onAnswer,
}: {
  answerWith: TestAnswerWith;
  answers: Record<string, string>;
  firstNumber: number;
  questions: TestQuestion[];
  termsById: Map<string, Term>;
  total: number;
  onAnswer: (questionId: string, answer: string) => void;
}) {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const usedTermIds = new Set(questions.map(({ id }) => answers[id]).filter(Boolean));
  const lastNumber = firstNumber + questions.length - 1;
  const assign = (questionId: string) => {
    if (!selectedTermId) {
      return;
    }

    onAnswer(questionId, selectedTermId);
    setSelectedTermId(null);
  };

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-7">
      <p className="mb-2 text-sm font-medium text-[var(--app-text-muted)]">
        Вопросы для сопоставления · {firstNumber}–{lastNumber} из {total}
      </p>
      <h2 className="text-lg font-bold text-[var(--app-text-strong)] sm:text-xl">
        Выберите ответ, затем нажмите на подходящую строку
      </h2>

      <div className="mt-6 flex flex-wrap gap-2 border-y border-[var(--app-divider)] py-5">
        {questions.map((question) => {
          const term = termsById.get(question.termId);
          const used = usedTermIds.has(question.termId);

          return term ? (
            <button
              key={question.termId}
              type="button"
              className={`btn h-auto min-h-10 max-w-full whitespace-normal ${selectedTermId === question.termId ? "btn-primary" : "btn-outline"}`}
              onClick={() => setSelectedTermId(question.termId)}
              disabled={used}
            >
              {getTestExpectedAnswer(term, answerWith)}
            </button>
          ) : null;
        })}
      </div>

      <div className="mt-5 space-y-3">
        {questions.map((question) => {
          const term = termsById.get(question.termId);
          const assignedTerm = answers[question.id]
            ? termsById.get(answers[question.id])
            : null;

          return term ? (
            <div key={question.id} className="grid grid-cols-1 gap-3 rounded-xl bg-base-200 p-3 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,2fr)] sm:items-center sm:p-4">
              <button
                type="button"
                className={`min-h-12 rounded-lg border-2 px-3 text-left transition-colors ${assignedTerm ? "border-primary bg-primary/10 text-[var(--app-text-strong)]" : selectedTermId ? "border-primary/60 border-dashed text-primary" : "border-[var(--app-border)] border-dashed text-[var(--app-text-muted)]"}`}
                onClick={() =>
                  assignedTerm
                    ? onAnswer(question.id, "")
                    : assign(question.id)
                }
                aria-label={assignedTerm ? `Убрать ответ ${getTestExpectedAnswer(assignedTerm, answerWith)}` : "Поместить выбранный ответ"}
              >
                {assignedTerm
                  ? getTestExpectedAnswer(assignedTerm, answerWith)
                  : "Выберите ответ"}
              </button>
              <p className="break-words text-[var(--app-text-strong)]">
                {getTestPrompt(term, answerWith)}
              </p>
            </div>
          ) : null;
        })}
      </div>
    </section>
  );
}

function AnswerButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`min-h-16 rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition-colors ${active ? "border-primary bg-primary/10 text-[var(--app-text-strong)]" : "border-[var(--app-border-strong,var(--app-border))] text-[var(--app-text-strong)] hover:border-primary hover:bg-primary/5"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PromptBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="min-w-0 sm:pr-6">
      <div className="mb-4 flex items-center gap-2">
        <p className="text-sm font-bold text-[var(--app-text-muted)]">{label}</p>
        <SpeakButton text={text} />
      </div>
      <p className="break-words text-xl leading-relaxed text-[var(--app-text-strong)] sm:text-2xl">
        {text}
      </p>
    </div>
  );
}

function TestResults({
  moduleId,
  moduleTitle,
  state,
  terms,
  termsById,
  onNewTest,
  onRetake,
}: {
  moduleId: string;
  moduleTitle: string;
  state: TestExerciseState;
  terms: Term[];
  termsById: Map<string, Term>;
  onNewTest: () => void;
  onRetake: () => void;
}) {
  const score = getTestScore(state, terms);
  const results = getTestQuestionResults(state, terms);

  return (
    <div className="page-container px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 xl:grid-cols-[14rem_minmax(0,1fr)] xl:gap-8">
        <aside className="min-w-0 xl:sticky xl:top-[calc(var(--app-header-height)+1.25rem)] xl:self-start">
          <Link
            href={`/module/${moduleId}`}
            className="btn btn-ghost mb-4 justify-start gap-2 px-2 text-[var(--app-text-strong)]"
          >
            <span aria-hidden="true">←</span>
            Назад к модулю
          </Link>
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4 shadow-sm">
            <p className="font-bold text-[var(--app-text-strong)]">test</p>
            <p className="mt-1 truncate text-sm text-[var(--app-text-muted)]" title={moduleTitle}>
              {moduleTitle}
            </p>
            <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
              {results.map((result, index) => (
                <a
                  key={result.question.id}
                  href={`#result-${result.question.id}`}
                  className={`flex h-11 w-full items-center justify-center rounded-lg text-sm font-bold ${result.isCorrect ? "bg-success/15 text-success" : "bg-error/15 text-error"}`}
                  aria-label={`Вопрос ${index + 1}: ${result.isCorrect ? "верно" : "неверно"}`}
                >
                  {result.isCorrect ? "✓" : "×"}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <section className="mb-5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-sm sm:p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
              <div
                className={`radial-progress text-2xl font-bold ${score.percentage >= 70 ? "text-success" : score.percentage >= 50 ? "text-warning" : "text-error"}`}
                style={{ "--value": score.percentage, "--size": "8rem" } as React.CSSProperties}
                role="progressbar"
                aria-valuenow={score.percentage}
                aria-label={`Результат теста: ${score.percentage}%`}
              >
                {score.percentage}%
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-primary">
                  {score.correct} / {score.total}
                </p>
                <h1 className="mt-2 text-3xl font-bold text-[var(--app-text-strong)] sm:text-4xl">
                  {getResultHeading(score.percentage)}
                </h1>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="font-bold text-success">Правильно: {score.correct}</span>
                  <span className="font-bold text-error">Ошибки: {score.incorrect}</span>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-[var(--app-divider)] pt-6 sm:flex-row sm:justify-end">
              <button type="button" className="btn btn-outline" onClick={onRetake}>
                Повторить test
              </button>
              <button type="button" className="btn btn-primary" onClick={onNewTest}>
                Новый test
              </button>
            </div>
          </section>

          <div className="space-y-4">
            {results.map((result, index) => (
              <ResultCard
                key={result.question.id}
                answerWith={state.settings.answerWith}
                index={index}
                result={result}
                termsById={termsById}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function ResultCard({
  answerWith,
  index,
  result,
  termsById,
}: {
  answerWith: TestAnswerWith;
  index: number;
  result: TestQuestionResult;
  termsById: Map<string, Term>;
}) {
  const term = termsById.get(result.question.termId);

  if (!term) {
    return null;
  }

  const submittedLabel = getSubmittedResultLabel(result, answerWith, termsById);

  return (
    <section
      id={`result-${result.question.id}`}
      className={`scroll-mt-5 rounded-2xl border bg-[var(--app-panel)] p-5 shadow-sm sm:p-7 ${result.isCorrect ? "border-success/40" : "border-error/40"}`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[var(--app-text-muted)]">
          Вопрос {index + 1}
        </span>
        <span className={`badge gap-1 ${result.isCorrect ? "badge-success" : "badge-error"}`}>
          {result.isCorrect ? "✓ Верно" : "× Ошибка"}
        </span>
      </div>
      <p className="break-words text-xl text-[var(--app-text-strong)]">
        {getResultPrompt(result.question, term, answerWith, termsById)}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ResultAnswer
          label="Ваш ответ"
          text={submittedLabel || "Нет ответа"}
          correct={result.isCorrect}
        />
        {!result.isCorrect && (
          <ResultAnswer label="Правильный ответ" text={result.expectedAnswer} correct />
        )}
      </div>
    </section>
  );
}

function ResultAnswer({
  correct,
  label,
  text,
}: {
  correct: boolean;
  label: string;
  text: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${correct ? "border-success/50 bg-success/10" : "border-error/50 bg-error/10"}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--app-text-muted)]">
        {label}
      </p>
      <p className={`mt-2 break-words font-bold ${correct ? "text-success" : "text-error"}`}>
        {text}
      </p>
    </div>
  );
}

function getSubmittedResultLabel(
  result: TestQuestionResult,
  answerWith: TestAnswerWith,
  termsById: Map<string, Term>,
) {
  if (result.question.type === "true-false") {
    return result.submittedAnswer === "true" ? "Верно" : "Неверно";
  }

  if (
    result.question.type === "choice" ||
    result.question.type === "matching"
  ) {
    const term = termsById.get(result.submittedAnswer);
    return term ? getTestExpectedAnswer(term, answerWith) : "";
  }

  return result.submittedAnswer;
}

function getResultPrompt(
  question: TestQuestion,
  term: Term,
  answerWith: TestAnswerWith,
  termsById: Map<string, Term>,
) {
  const prompt = getTestPrompt(term, answerWith);

  if (question.type !== "true-false" || !question.shownTermId) {
    return prompt;
  }

  const shownTerm = termsById.get(question.shownTermId);
  const shownAnswer = shownTerm
    ? getTestExpectedAnswer(shownTerm, answerWith)
    : "—";

  return `${prompt} — ${shownAnswer}`;
}

function getResultHeading(percentage: number) {
  if (percentage === 100) {
    return "Превосходный результат!";
  }
  if (percentage >= 70) {
    return "Отличная работа!";
  }
  if (percentage >= 50) {
    return "Хорошее начало";
  }
  return "Стоит повторить термины";
}

function EmptyTestExercise({
  moduleId,
  moduleTitle,
}: {
  moduleId: string;
  moduleTitle: string;
}) {
  return (
    <div className="page-container px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-2xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-6 text-center shadow-sm sm:p-10">
        <TestIcon />
        <p className="mt-4 text-sm font-bold uppercase tracking-wide text-primary">
          test · {moduleTitle}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--app-text-strong)]">
          В модуле пока нет терминов
        </h1>
        <p className="mt-3 text-[var(--app-text-muted)]">
          Добавьте хотя бы один термин, чтобы составить test.
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

function clampQuestionCount(value: number, termCount: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(termCount, Math.floor(value)));
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
      className="btn btn-circle btn-ghost btn-xs text-[var(--app-text-muted)]"
      onClick={speak}
      aria-label="Прослушать вопрос"
    >
      <SpeakerIcon />
    </button>
  );
}

function TestIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-12 shrink-0 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M7 3h8l4 4v14H7V3Zm8 0v5h4M10 12h6M10 16h6"
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
      className="h-4 w-4"
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
