import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Term } from "@/types/module";
import {
  createInitialWriteState,
  saveWriteSession,
  submitWriteAnswer,
} from "@/lib/write-exercise";
import WriteExercise from "./WriteExercise";

const terms: Term[] = [
  {
    id: "term-1",
    term: "Apple",
    definition: "a round fruit",
  },
];

function renderExercise(customTerms = terms) {
  return render(
    <WriteExercise
      moduleId="module-1"
      moduleTitle="English words"
      terms={customTerms}
    />,
  );
}

describe("WriteExercise", () => {
  it("submits a normalized answer with Enter and completes the exercise", async () => {
    const user = userEvent.setup();
    renderExercise();

    const input = await screen.findByLabelText("Введите ответ");
    const submitButton = screen.getByRole("button", { name: "Ответить" });

    expect(input).toHaveFocus();
    expect(submitButton).toBeDisabled();

    await user.type(input, "  APPLE  {Enter}");

    expect(await screen.findByRole("status")).toHaveTextContent("Верно!");
    expect(screen.getByLabelText("Правильно: 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByRole("heading", { name: "Все термины освоены" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1/1 — 100%")).toBeInTheDocument();
  });

  it("repeats a skipped term in a new stage", async () => {
    const user = userEvent.setup();
    renderExercise();

    await screen.findByLabelText("Введите ответ");
    await user.click(screen.getByRole("button", { name: "Не знаю" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Нужно повторить",
    );
    expect(screen.getByText("Нет ответа")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByLabelText("Неправильно: 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(await screen.findByText("Этап 2")).toBeInTheDocument();
    const input = screen.getByLabelText("Введите ответ");
    await user.type(input, "apple{Enter}");
    await user.click(
      await screen.findByRole("button", { name: "Продолжить" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Все термины освоены" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Этап [12]/)).toHaveLength(2);
  });

  it("allows an incorrect answer to be marked correct", async () => {
    const user = userEvent.setup();
    renderExercise();

    const input = await screen.findByLabelText("Введите ответ");
    await user.type(input, "pear{Enter}");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Нужно повторить",
    );
    await user.click(
      screen.getByRole("button", { name: "Я ответил правильно" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent("Верно!");
    expect(
      screen.queryByRole("button", { name: "Я ответил правильно" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));
    expect(
      await screen.findByRole("heading", { name: "Все термины освоены" }),
    ).toBeInTheDocument();
  });

  it("restores saved feedback after a refresh", async () => {
    let savedState = createInitialWriteState(terms, () => 0.999);
    savedState = submitWriteAnswer(savedState, terms[0], "pear");
    saveWriteSession(sessionStorage, "module-1", terms, savedState);

    renderExercise();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Нужно повторить",
    );
    expect(screen.getByText("pear")).toBeInTheDocument();
  });

  it("restarts a completed exercise", async () => {
    const user = userEvent.setup();
    renderExercise();

    const input = await screen.findByLabelText("Введите ответ");
    await user.type(input, "apple{Enter}");
    await user.click(
      await screen.findByRole("button", { name: "Продолжить" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Пройти заново" }),
    );

    expect(await screen.findByLabelText("Введите ответ")).toHaveValue("");
    await waitFor(() => {
      expect(screen.queryByText("Все термины освоены")).not.toBeInTheDocument();
    });
  });

  it("shows links to add terms when the module is empty", () => {
    renderExercise([]);

    expect(
      screen.getByRole("heading", { name: "В модуле пока нет терминов" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Добавить термины" })).toHaveAttribute(
      "href",
      "/module/module-1/edit",
    );
    expect(
      screen.getByRole("link", { name: "Вернуться к модулю" }),
    ).toHaveAttribute("href", "/module/module-1");
  });
});
