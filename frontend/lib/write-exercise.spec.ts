import { beforeEach, describe, expect, it } from "vitest";

import type { Term } from "@/types/module";
import {
  continueWriteExercise,
  createInitialWriteState,
  getWriteSessionStorageKey,
  isWriteAnswerCorrect,
  loadWriteSession,
  normalizeWriteAnswer,
  overrideWriteAnswer,
  saveWriteSession,
  shuffleTermIds,
  submitWriteAnswer,
} from "./write-exercise";

const terms: Term[] = [
  {
    id: "term-1",
    term: "Apple",
    definition: "a round fruit",
  },
  {
    id: "term-2",
    term: "make a decision",
    definition: "choose what to do",
  },
];

const keepOrder = () => 0.999;

describe("write exercise state", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("normalizes surrounding whitespace and case only", () => {
    expect(normalizeWriteAnswer("  APPLE  ")).toBe("apple");
    expect(isWriteAnswerCorrect("  APPLE  ", "Apple")).toBe(true);
    expect(isWriteAnswerCorrect("make  a decision", "make a decision")).toBe(
      false,
    );
    expect(isWriteAnswerCorrect("apple!", "apple")).toBe(false);
  });

  it("shuffles a copy without changing the source list", () => {
    const source = ["one", "two", "three"];
    const shuffled = shuffleTermIds(source, () => 0);

    expect(source).toEqual(["one", "two", "three"]);
    expect(shuffled).toEqual(["two", "three", "one"]);
  });

  it("repeats only unresolved terms until every term is correct", () => {
    let state = createInitialWriteState(terms, keepOrder);

    state = submitWriteAnswer(state, terms[0], "pear");
    expect(state.incorrectCount).toBe(1);
    state = continueWriteExercise(state, terms.length, keepOrder);

    state = submitWriteAnswer(state, terms[1], "MAKE A DECISION");
    expect(state.correctCount).toBe(1);
    state = continueWriteExercise(state, terms.length, keepOrder);

    expect(state.stageNumber).toBe(2);
    expect(state.queue).toEqual(["term-1"]);
    expect(state.history[0].answers.map((answer) => answer.isCorrect)).toEqual([
      false,
      true,
    ]);

    state = submitWriteAnswer(state, terms[0], "apple");
    state = continueWriteExercise(state, terms.length, keepOrder);

    expect(state.completed).toBe(true);
    expect(state.history).toHaveLength(2);
    expect(state.correctCount).toBe(terms.length);
    expect(state.incorrectCount).toBe(0);
  });

  it("marks a skipped answer wrong and allows a manual override", () => {
    let state = createInitialWriteState([terms[0]], keepOrder);

    state = submitWriteAnswer(state, terms[0], "", true);
    expect(state.feedback).toMatchObject({
      isCorrect: false,
      wasSkipped: true,
    });

    state = overrideWriteAnswer(state);
    expect(state.feedback).toMatchObject({
      isCorrect: true,
      wasSkipped: true,
      wasOverridden: true,
    });
    expect(state.unresolvedTermIds).toEqual([]);
    expect(state.correctCount).toBe(1);
    expect(state.incorrectCount).toBe(0);

    state = continueWriteExercise(state, 1, keepOrder);
    expect(state.completed).toBe(true);
    expect(state.history[0].answers[0].wasOverridden).toBe(true);
  });

  it("saves and restores a valid session", () => {
    let state = createInitialWriteState(terms, keepOrder);
    state = submitWriteAnswer(state, terms[0], "apple");

    saveWriteSession(sessionStorage, "module-1", terms, state);

    expect(loadWriteSession(sessionStorage, "module-1", terms)).toEqual(state);
  });

  it.each([
    ["corrupted JSON", "not-json"],
    ["outdated payload", JSON.stringify({ version: 0 })],
  ])("discards %s", (_label, storedValue) => {
    const key = getWriteSessionStorageKey("module-1");
    sessionStorage.setItem(key, storedValue);

    expect(loadWriteSession(sessionStorage, "module-1", terms)).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it("discards progress when the module terms change", () => {
    const state = createInitialWriteState(terms, keepOrder);
    saveWriteSession(sessionStorage, "module-1", terms, state);

    const changedTerms = [
      terms[0],
      { ...terms[1], definition: "a changed definition" },
    ];

    expect(
      loadWriteSession(sessionStorage, "module-1", changedTerms),
    ).toBeNull();
  });
});
