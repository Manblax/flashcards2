import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Term } from "@/types/module";
import LearnExercise from "./LearnExercise";

const terms: Term[] = [
  {
    id: "term-1",
    term: "Apple",
    definition: "a round fruit",
  },
];

function renderExercise(customTerms = terms) {
  return render(
    <LearnExercise
      moduleId="module-1"
      moduleTitle="English words"
      terms={customTerms}
    />,
  );
}

describe("LearnExercise", () => {
  it("accepts a written answer and shows immediate feedback", async () => {
    const user = userEvent.setup();
    renderExercise();

    const input = await screen.findByLabelText("Ваш ответ");
    expect(input).toHaveFocus();

    await user.type(input, "  APPLE  {Enter}");

    expect(await screen.findByRole("status")).toHaveTextContent("Верно!");
    expect(screen.getByLabelText("Общий прогресс: 33%")).toBeInTheDocument();
  });

  it("shows the answer after the user is unsure", async () => {
    const user = userEvent.setup();
    renderExercise();

    await screen.findByLabelText("Ваш ответ");
    await user.click(screen.getByRole("button", { name: "Не уверен?" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Пока не получилось",
    );
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Продолжить" })).toBeInTheDocument();
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
