import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createModule,
  lookupDictionary,
  synthesizeSpeech,
  updateModule,
  type DictionaryLookupResult,
} from "@/lib/api";
import { DICTIONARY_SOURCE_SETTING_KEY } from "@/lib/dictionary-settings";
import type { Module } from "@/types/module";
import ModuleForm from "./ModuleForm";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  createModule: vi.fn(),
  updateModule: vi.fn(),
  lookupDictionary: vi.fn(),
  synthesizeSpeech: vi.fn(),
}));

const existingModule: Module = {
  id: "module-1",
  title: "Vocabulary",
  author: "test",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  termCount: 2,
  terms: [
    { id: "term-1", term: "apple", definition: "" },
    { id: "term-2", term: "book", definition: "My own definition" },
  ],
};

describe("ModuleForm dictionary definitions without audio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createModule).mockResolvedValue(existingModule);
    vi.mocked(updateModule).mockResolvedValue(existingModule);
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  describe.each(["cambridge", "oxford"] as const)("%s", (source) => {
    it.each(["create", "edit"] as const)(
      "lets the user select and save a definition in %s mode without audio",
      async (mode) => {
        const definition = "a round fruit with a red or green skin";
        const lookup: DictionaryLookupResult = {
          word: "apple",
          normalizedWord: "apple",
          suggestedDefinition: definition,
          definitions: [{ text: definition, examples: [], source }],
          ipa: {},
          audio: {},
          sources: { definitions: source },
          cached: true,
        };
        localStorage.setItem(DICTIONARY_SOURCE_SETTING_KEY, source);
        vi.mocked(lookupDictionary).mockResolvedValue(lookup);
        const user = userEvent.setup();
        render(
          <ModuleForm
            mode={mode}
            initialData={mode === "edit" ? existingModule : undefined}
          />,
        );

        if (mode === "create") {
          await user.type(
            screen.getByRole("textbox", { name: "Название" }),
            "Vocabulary",
          );
          await user.type(
            screen.getByRole("textbox", { name: "Термин 1" }),
            "apple",
          );
          await user.type(
            screen.getByRole("textbox", { name: "Термин 2" }),
            "book",
          );
          await user.type(
            screen.getByRole("textbox", { name: "Определение 2" }),
            "My own definition",
          );
        }

        const definitionField = screen.getByRole("textbox", {
          name: "Определение 1",
        });
        await user.click(definitionField);
        const suggestion = await screen.findByRole("button", {
          name: definition,
        });
        expect(lookupDictionary).toHaveBeenCalledWith("apple");
        expect(definitionField).toHaveValue("");
        expect(
          screen.getByRole("textbox", { name: "Определение 2" }),
        ).toHaveValue("My own definition");

        await user.click(suggestion);
        expect(definitionField).toHaveValue(definition);
        await user.click(
          screen.getByRole("button", {
            name: mode === "create" ? "Создать" : "Готово",
          }),
        );

        const expected = {
          title: "Vocabulary",
          description: "",
          terms: [
            { term: "apple", definition, image: undefined },
            { term: "book", definition: "My own definition", image: undefined },
          ],
        };
        await waitFor(() => {
          if (mode === "create")
            expect(createModule).toHaveBeenCalledWith(expected);
          else expect(updateModule).toHaveBeenCalledWith("module-1", expected);
          expect(push).toHaveBeenCalledWith(
            mode === "create" ? "/" : "/module/module-1",
          );
        });
        expect(synthesizeSpeech).not.toHaveBeenCalled();
        expect(lookup.definitions[0].source).toBe(source);
      },
    );
  });
});
