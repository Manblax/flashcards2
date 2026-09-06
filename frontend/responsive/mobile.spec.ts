import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.context().addCookies([{ name: "token", value: "responsive-test", url: "http://127.0.0.1:3100" }]);
  await page.addInitScript(() => {
    localStorage.setItem("token", "responsive-test");
    localStorage.setItem("user", JSON.stringify({ id: "test", username: "responsive_tester", email: "responsive@example.com" }));
  });
}

test.beforeEach(async ({ page }) => {
  test.skip(page.viewportSize()!.width >= 640, "Phone-only layout behavior");
});

test("editor wraps fields and keeps its own toolbar visible", async ({ page }) => {
  await signIn(page);
  await page.goto("/module/responsive/edit");
  await expect(page.locator(".app-header")).toBeHidden();
  const definition = page.getByRole("textbox", { name: "Определение 1", exact: true });
  await expect(definition).toHaveJSProperty("tagName", "TEXTAREA");
  await expect.poll(async () => (await definition.boundingBox())!.height).toBeGreaterThan(44);
  const value = "A definition long enough to wrap onto multiple lines without losing any of the existing text.";
  await definition.fill(value);
  await page.getByRole("button", { name: "+ Добавить карточку" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Готово", exact: true })).toBeInViewport({ ratio: 1 });
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(definition).toHaveJSProperty("tagName", "INPUT");
  await expect(definition).toHaveValue(value);
  await expect(page.locator(".app-header")).toBeVisible();
});

test("dictionary selection still fills a wrapped definition", async ({ page }) => {
  await signIn(page);
  const text = "Continue doing something even when it becomes difficult or takes longer than expected.";
  await page.route("**/dictionary/lookup?**", route => route.fulfill({ json: {
    word: "carry on", normalizedWord: "carry on", suggestedDefinition: text,
    definitions: [{ text, examples: [], source: "cambridge" }], ipa: {}, audio: {}, cached: true,
  } }));
  await page.goto("/module/responsive/edit");
  await page.getByRole("textbox", { name: "Определение 1", exact: true }).focus();
  await page.getByRole("button", { name: text, exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Определение 1", exact: true })).toHaveValue(text);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
});

test("account menu opens as a sheet and closes by backdrop or navigation", async ({ page }, info) => {
  await signIn(page);
  await page.goto("/library");
  await page.getByRole("button", { name: "Меню пользователя", exact: true }).click();
  const panel = page.locator(".user-menu-panel");
  await expect(panel).toBeVisible();
  await expect.poll(async () => Math.round((await panel.boundingBox())!.y + (await panel.boundingBox())!.height)).toBe(page.viewportSize()!.height);
  await expect(panel).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath("account-sheet.png") });
  await page.getByRole("button", { name: "Закрыть меню пользователя", exact: true }).click({ position: { x: 10, y: 200 } });
  await expect(panel).toBeHidden();
  await page.getByRole("button", { name: "Меню пользователя", exact: true }).click();
  await panel.getByRole("link", { name: "Настройки", exact: true }).click();
  await expect(page).toHaveURL("/settings");
  await expect(panel).toBeHidden();
});

test("write input keeps a usable height and works in a shortened viewport", async ({ page }) => {
  await signIn(page);
  await page.goto("/module/responsive/write");
  const answer = page.getByLabel("Введите ответ", { exact: true });
  await expect(answer).toBeVisible();
  expect((await answer.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await answer.fill("my answer");
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 400 });
  await expect(answer).toHaveValue("my answer");
  await page.getByRole("button", { name: "Ответить", exact: true }).click();
  await expect(page.getByRole("button", { name: "Продолжить", exact: true })).toBeVisible();
});

test("study links use two columns and card ratings stay centered", async ({ page }) => {
  await signIn(page);
  await page.goto("/module/responsive");
  const links = page.locator(".study-modes a");
  await expect(links).toHaveCount(5);
  const first = (await links.nth(0).boundingBox())!;
  const second = (await links.nth(1).boundingBox())!;
  expect(second.y).toBe(first.y);
  expect(second.x).toBeGreaterThan(first.x);
  await links.nth(0).click();
  await expect(page.getByRole("button", { name: "Знаю", exact: true })).toBeInViewport({ ratio: 1 });
  const rating = (await page.locator(".card-rating").boundingBox())!;
  expect(Math.abs(rating.x + rating.width / 2 - page.viewportSize()!.width / 2)).toBeLessThan(1);
});

test("password visibility controls have touch-sized targets", async ({ page }) => {
  for (const path of ["/login", "/register"]) {
    await page.goto(path);
    const field = page.locator('input[autocomplete$="password"]');
    await field.fill("password-example");
    const toggle = page.locator(".password-toggle");
    const box = (await toggle.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await toggle.click();
    await expect(field).toHaveAttribute("type", "text");
    await expect(field).toHaveValue("password-example");
  }
});
