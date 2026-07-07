import { expect, test } from "@playwright/test";

test.describe("login page", () => {
  test("fills credentials and toggles password visibility", async ({ page }) => {
    await page.goto("/login?redirect=/library");

    const username = page.getByLabel("Эл. почта или имя пользователя");
    const password = page.locator("#login-password");

    await username.pressSequentially("demo@example.com");
    await password.pressSequentially("password123");

    await expect(username).toHaveValue("demo@example.com");
    await expect(password).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Показать пароль" }).click();
    await expect(password).toHaveAttribute("type", "text");

    await expect(
      page.getByRole("main").getByRole("link", { name: "Зарегистрироваться" }),
    ).toHaveAttribute("href", "/register?redirect=%2Flibrary");
    await expect(page.getByRole("link", { name: "Войти через Google" })).toHaveAttribute(
      "href",
      "http://localhost:3001/auth/google",
    );
  });

  test("shows the Google auth failure message", async ({ page }) => {
    await page.goto("/login?error=oauth");

    await expect(
      page.getByText("Не удалось войти через Google. Попробуйте еще раз."),
    ).toBeVisible();
  });
});
