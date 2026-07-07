import { expect, test } from "@playwright/test";

test.describe("register page", () => {
  test("fills account details and preserves redirect on login link", async ({
    page,
  }) => {
    await page.goto("/register?redirect=/create");

    await page.getByLabel("Эл. почта").pressSequentially("demo@example.com");
    await page.getByLabel("Имя пользователя").pressSequentially("demo");

    const password = page.locator("#register-password");
    await password.pressSequentially("password123");
    await expect(password).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Показать пароль" }).click();
    await expect(password).toHaveAttribute("type", "text");

    await expect(page.getByLabel("Эл. почта")).toHaveValue("demo@example.com");
    await expect(page.getByLabel("Имя пользователя")).toHaveValue("demo");
    await expect(
      page.getByRole("main").getByRole("link", { name: "Войти" }),
    ).toHaveAttribute("href", "/login?redirect=%2Fcreate");
    await expect(
      page.getByRole("link", { name: "Продолжить через Google" }),
    ).toHaveAttribute("href", "http://localhost:3001/auth/google");
  });
});
