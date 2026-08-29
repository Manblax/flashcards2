import { beforeEach, describe, expect, it } from "vitest";

import type { Term } from "@/types/module";
import {
  answerTestQuestion,
  canSubmitTest,
  createDefaultTestSettings,
  createTestExerciseState,
  getAnsweredTestQuestionCount,
  getTestQuestionResults,
  getTestScore,
  getTestSessionStorageKey,
  loadTestSession,
  saveTestSession,
  submitTestExercise,
} from "./test-exercise";

const terms: Term[] = Array.from({ length: 8 }, (_, index) => ({
  id: `term-${index + 1}`,
  term: `Word ${index + 1}`,
  definition: `Definition ${index + 1}`,
}));

describe("test exercise state", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("generates the requested number of questions across enabled types", () => {
    const state = createTestExerciseState(
      terms,
      createDefaultTestSettings(terms),
      () => 0.999,
    );

    expect(state.questions).toHaveLength(8);
    expect(state.questions.map(({ type }) => type)).toEqual([
      "true-false",
      "true-false",
      "choice",
      "choice",
      "matching",
      "matching",
      "written",
      "written",
    ]);
  });

  it("records answers, prevents premature submission, and calculates a score", () => {
    let state = createTestExerciseState(
      terms,
      createDefaultTestSettings(terms),
      () => 0.999,
    );

    state.questions.forEach((question) => {
      let correctAnswer: string;

      if (question.type === "true-false") {
        correctAnswer = String(Boolean(question.statementIsCorrect));
      } else if (
        question.type === "choice" ||
        question.type === "matching"
      ) {
        correctAnswer = question.termId;
      } else {
        correctAnswer = terms.find(({ id }) => id === question.termId)!.term;
      }

      state = answerTestQuestion(state, question.id, correctAnswer);
    });

    expect(getAnsweredTestQuestionCount(state)).toBe(8);
    expect(canSubmitTest(state)).toBe(true);

    state = submitTestExercise(state);

    expect(state.submitted).toBe(true);
    expect(getTestScore(state, terms)).toEqual({
      correct: 8,
      incorrect: 0,
      total: 8,
      percentage: 100,
    });
    expect(getTestQuestionResults(state, terms).every(({ isCorrect }) => isCorrect)).toBe(
      true,
    );
  });

  it("does not submit until every question has an answer", () => {
    const state = createTestExerciseState(
      terms,
      {
        ...createDefaultTestSettings(terms),
        questionCount: 2,
      },
      () => 0.999,
    );

    expect(submitTestExercise(state)).toBe(state);
  });

  it("moves a matching answer instead of assigning it twice", () => {
    let state = createTestExerciseState(
      terms,
      {
        questionCount: 3,
        answerWith: "term",
        types: {
          trueFalse: false,
          choice: false,
          matching: true,
          written: false,
        },
      },
      () => 0.999,
    );
    const [first, second] = state.questions;

    state = answerTestQuestion(state, first.id, first.termId);
    state = answerTestQuestion(state, second.id, first.termId);

    expect(state.answers[first.id]).toBeUndefined();
    expect(state.answers[second.id]).toBe(first.termId);
  });

  it("saves and restores a valid test session", () => {
    const state = createTestExerciseState(
      terms,
      createDefaultTestSettings(terms),
      () => 0.999,
    );

    saveTestSession(sessionStorage, "module-1", terms, state);

    expect(loadTestSession(sessionStorage, "module-1", terms)).toEqual(state);
  });

  it.each([
    ["corrupted JSON", "not-json"],
    ["outdated payload", JSON.stringify({ version: 0 })],
  ])("discards %s", (_label, storedValue) => {
    const key = getTestSessionStorageKey("module-1");
    sessionStorage.setItem(key, storedValue);

    expect(loadTestSession(sessionStorage, "module-1", terms)).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it("discards progress after the module terms change", () => {
    const state = createTestExerciseState(
      terms,
      createDefaultTestSettings(terms),
      () => 0.999,
    );
    saveTestSession(sessionStorage, "module-1", terms, state);

    expect(
      loadTestSession(sessionStorage, "module-1", [
        ...terms.slice(0, -1),
        { ...terms.at(-1)!, definition: "Changed" },
      ]),
    ).toBeNull();
  });
});
