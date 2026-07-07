import { expect, test } from "@playwright/test";

test.describe("guest home", () => {
  test("shows the guest landing page and navigates to auth screens", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Учите слова по своим модулям" }),
    ).toBeVisible();
    await expect(page.getByText("English: phrasal verbs")).toBeVisible();

    const main = page.getByRole("main");

    await main.getByRole("link", { name: "Зарегистрироваться" }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(
      page.getByRole("heading", { name: "Регистрация" }),
    ).toBeVisible();

    await page.goto("/");
    await main.getByRole("link", { name: "Войти" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
  });
});
