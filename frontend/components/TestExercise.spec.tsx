import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Term } from "@/types/module";
import TestExercise from "./TestExercise";

const terms: Term[] = [
  {
    id: "term-1",
    term: "Apple",
    definition: "a round fruit",
  },
];

function renderExercise(customTerms = terms) {
  return render(
    <TestExercise
      moduleId="module-1"
      moduleTitle="English words"
      terms={customTerms}
    />,
  );
}

describe("TestExercise", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
      writable: true,
    });
  });

  it("configures, completes, and scores a written test", async () => {
    const user = userEvent.setup();
    renderExercise();

    expect(
      await screen.findByRole("heading", { name: "Настройте свой test" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: /^Вопросы/ }),
    ).toHaveValue(1);

    await user.click(screen.getByRole("button", { name: "Начать test" }));

    const input = await screen.findByLabelText("Ваш ответ");
    const finishButton = screen.getByRole("button", {
      name: "Завершить test",
    });
    expect(finishButton).toBeDisabled();

    await user.type(input, "  APPLE  ");
    expect(finishButton).toBeEnabled();
    await user.click(finishButton);

    expect(
      await screen.findByRole("heading", {
        name: "Превосходный результат!",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Результат теста: 100%")).toBeInTheDocument();
    expect(screen.getByText("Правильно: 1")).toBeInTheDocument();
  });

  it("requires at least one enabled question type", async () => {
    const user = userEvent.setup();
    renderExercise();

    await screen.findByRole("heading", { name: "Настройте свой test" });
    await user.click(screen.getByRole("checkbox", { name: "Верно — неверно" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: "Вопросы с выбором ответа",
      }),
    );
    await user.click(screen.getByRole("checkbox", { name: "Письменные вопросы" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Выберите хотя бы один тип вопросов",
    );
    expect(screen.getByRole("button", { name: "Начать test" })).toBeDisabled();
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
