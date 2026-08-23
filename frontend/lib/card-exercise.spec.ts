import { beforeEach, describe, expect, it } from "vitest";

import type { Term } from "@/types/module";
import {
  createInitialCardState,
  getCardProgress,
  getCardSessionStorageKey,
  loadCardSession,
  rateCurrentCard,
  saveCardSession,
  shuffleRemainingCards,
  undoLastCardRating,
} from "./card-exercise";

const terms: Term[] = [
  { id: "term-1", term: "Apple", definition: "a round fruit" },
  { id: "term-2", term: "Book", definition: "pages bound together" },
  { id: "term-3", term: "Clock", definition: "a device that shows time" },
  { id: "term-4", term: "Door", definition: "an entrance barrier" },
];

describe("card exercise state", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("classifies each card and completes one pass", () => {
    let state = createInitialCardState(terms);

    expect(state.order).toEqual(["term-1", "term-2", "term-3", "term-4"]);
    expect(getCardProgress(state)).toBe(0);

    state = rateCurrentCard(state, "learning");
    state = rateCurrentCard(state, "known");
    state = rateCurrentCard(state, "known");
    state = rateCurrentCard(state, "known");

    expect(state.learningTermIds).toEqual(["term-1"]);
    expect(state.knownTermIds).toEqual(["term-2", "term-3", "term-4"]);
    expect(state.completed).toBe(true);
    expect(getCardProgress(state)).toBe(100);
  });

  it("undoes the latest classification, including after completion", () => {
    let state = createInitialCardState([terms[0]]);
    state = rateCurrentCard(state, "known");

    expect(state.completed).toBe(true);

    state = undoLastCardRating(state);

    expect(state.completed).toBe(false);
    expect(state.currentIndex).toBe(0);
    expect(state.knownTermIds).toEqual([]);
    expect(state.history).toEqual([]);
  });

  it("shuffles only cards that have not been rated", () => {
    let state = createInitialCardState(terms);
    state = rateCurrentCard(state, "known");

    state = shuffleRemainingCards(state, () => 0);

    expect(state.order).toEqual(["term-1", "term-2", "term-4", "term-3"]);
    expect(state.history[0].termId).toBe("term-1");
  });

  it("saves and restores a valid session", () => {
    const state = rateCurrentCard(createInitialCardState(terms), "known");

    saveCardSession(sessionStorage, "module-1", terms, state);

    expect(loadCardSession(sessionStorage, "module-1", terms)).toEqual(state);
  });

  it.each([
    ["corrupted JSON", "not-json"],
    ["outdated payload", JSON.stringify({ version: 0 })],
  ])("discards %s", (_label, storedValue) => {
    const key = getCardSessionStorageKey("module-1");
    sessionStorage.setItem(key, storedValue);

    expect(loadCardSession(sessionStorage, "module-1", terms)).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it("discards progress after the module terms change", () => {
    const state = createInitialCardState(terms);
    saveCardSession(sessionStorage, "module-1", terms, state);

    const changedTerms = [
      terms[0],
      terms[1],
      { ...terms[2], definition: "a changed definition" },
    ];

    expect(
      loadCardSession(sessionStorage, "module-1", changedTerms),
    ).toBeNull();
  });
});
