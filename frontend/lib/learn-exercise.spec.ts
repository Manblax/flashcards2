import { beforeEach, describe, expect, it } from "vitest";

import type { Term } from "@/types/module";
import {
  continueLearnExercise,
  createInitialLearnState,
  createLearnStageQueue,
  getLearnMasteryCount,
  getLearnProgress,
  getLearnSessionStorageKey,
  LEARN_MASTERY_TARGET,
  loadLearnSession,
  saveLearnSession,
  startNextLearnStage,
  submitLearnAnswer,
} from "./learn-exercise";

const terms: Term[] = Array.from({ length: 8 }, (_, index) => ({
  id: `term-${index + 1}`,
  term: `Word ${index + 1}`,
  definition: `Definition ${index + 1}`,
}));

describe("learn exercise state", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("starts with up to seven multiple-choice questions", () => {
    const state = createInitialLearnState(terms, () => 0.999);

    expect(state.queue).toHaveLength(7);
    expect(state.queue.every((question) => question.mode === "choice")).toBe(
      true,
    );
    expect(
      state.queue.every(
        (question) =>
          question.optionTermIds.length === 4 &&
          question.optionTermIds.includes(question.termId),
      ),
    ).toBe(true);
  });

  it("records correct and unsure answers and updates mastery and streak", () => {
    let state = createInitialLearnState(terms, () => 0.999);
    const firstTerm = terms.find(
      (term) => term.id === state.queue[0].termId,
    )!;

    state = submitLearnAnswer(state, firstTerm, `  ${firstTerm.term}  `);

    expect(state.feedback?.isCorrect).toBe(true);
    expect(state.mastery[firstTerm.id]).toBe(1);
    expect(state.streak).toBe(1);

    state = continueLearnExercise(state);
    const secondTerm = terms.find(
      (term) => term.id === state.queue[1].termId,
    )!;
    state = submitLearnAnswer(state, secondTerm, "", true);

    expect(state.feedback).toMatchObject({
      isCorrect: false,
      wasUnsure: true,
    });
    expect(state.mastery[secondTerm.id]).toBe(0);
    expect(state.streak).toBe(0);
  });

  it("mixes new choice questions with written practice after a stage", () => {
    const mastery = Object.fromEntries(
      terms.map((term, index) => [term.id, index < 4 ? 1 : 0]),
    );
    const queue = createLearnStageQueue(terms, mastery, () => 0.999);

    expect(queue).toHaveLength(7);
    expect(queue.filter((question) => question.mode === "choice")).toHaveLength(
      3,
    );
    expect(
      queue.filter((question) => question.mode === "written"),
    ).toHaveLength(4);
  });

  it("finishes a stage, starts the next one, and completes at full mastery", () => {
    const singleTerm = [terms[0]];
    let state = createInitialLearnState(singleTerm, () => 0.999);

    for (let stage = 1; stage <= LEARN_MASTERY_TARGET; stage += 1) {
      state = submitLearnAnswer(state, singleTerm[0], singleTerm[0].term);
      state = continueLearnExercise(state);

      expect(state.stageComplete).toBe(true);

      if (stage < LEARN_MASTERY_TARGET) {
        state = startNextLearnStage(state, singleTerm, () => 0.999);
      }
    }

    expect(state.completed).toBe(true);
    expect(getLearnMasteryCount(state)).toBe(LEARN_MASTERY_TARGET);
    expect(getLearnProgress(state, singleTerm.length)).toBe(100);
  });

  it("saves and restores a valid session", () => {
    const state = createInitialLearnState(terms, () => 0.999);

    saveLearnSession(sessionStorage, "module-1", terms, state);

    expect(loadLearnSession(sessionStorage, "module-1", terms)).toEqual(state);
  });

  it.each([
    ["corrupted JSON", "not-json"],
    ["outdated payload", JSON.stringify({ version: 0 })],
  ])("discards %s", (_label, storedValue) => {
    const key = getLearnSessionStorageKey("module-1");
    sessionStorage.setItem(key, storedValue);

    expect(loadLearnSession(sessionStorage, "module-1", terms)).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it("discards progress when module terms change", () => {
    const state = createInitialLearnState(terms, () => 0.999);
    saveLearnSession(sessionStorage, "module-1", terms, state);

    expect(
      loadLearnSession(sessionStorage, "module-1", [
        ...terms.slice(0, -1),
        { ...terms.at(-1)!, definition: "Changed" },
      ]),
    ).toBeNull();
  });
});
