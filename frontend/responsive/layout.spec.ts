import { expect, test, type Page } from '@playwright/test';

async function fitsWidth(page: Page) {
  const width = page.viewportSize()!.width;
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

async function signIn(page: Page) {
  await page.context().addCookies([{ name: 'token', value: 'responsive-test', url: 'http://127.0.0.1:3100' }]);
  await page.addInitScript(() => {
    localStorage.setItem('token', 'responsive-test');
    localStorage.setItem('user', JSON.stringify({ id: 'test', username: 'responsive_tester', email: 'responsive@example.com' }));
  });
}

test('public pages fit and authentication controls remain reachable', async ({ page }) => {
  for (const path of ['/', '/login', '/register']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    await fitsWidth(page);
  }
});

test('all authenticated pages fit, including long content', async ({ page }, info) => {
  await signIn(page);
  for (const path of ['/', '/library', '/settings', '/create', '/module/responsive', '/module/responsive/edit', '/module/responsive/card', '/module/responsive/learn', '/module/responsive/write', '/module/responsive/spell', '/module/responsive/test', '/module/stress', '/module/stress/card', '/module/stress/learn', '/module/stress/write', '/module/stress/spell', '/module/stress/test', '/module/stress/edit']) {
    await page.goto(path);
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('.loading-spinner')).toHaveCount(0);
    await fitsWidth(page);
    if (!path.includes('stress')) await page.screenshot({ path: info.outputPath(`${path.replaceAll('/', '-') || 'home'}.png`) });
  }
});

test('drawer overlays content on tablets and closes after navigation', async ({ page }) => {
  await signIn(page);
  await page.goto('/');
  const menu = page.getByLabel('Открыть меню');
  if (page.viewportSize()!.width >= 1280) {
    await expect(menu).toBeHidden();
    await expect(page.getByRole('link', { name: /Ваша библиотека/ })).toBeVisible();
  } else {
    const before = await page.locator('main').boundingBox();
    await menu.click();
    await page.getByRole('link', { name: /Ваша библиотека/ }).click();
    await expect(page).toHaveURL('/library');
    await expect(page.locator('#app-sidebar')).not.toBeChecked();
    expect((await page.locator('main').boundingBox())!.width).toBe(before!.width);
  }
});

test('editor toolbar and import actions survive scrolling and long text', async ({ page }) => {
  await signIn(page);
  await page.goto('/module/responsive/edit');
  await page.getByRole('button', { name: '+ Добавить карточку' }).scrollIntoViewIfNeeded();
  const header = await page.locator('.app-header').boundingBox();
  const save = await page.getByRole('button', { name: 'Готово', exact: true }).boundingBox();
  expect(save!.y).toBeGreaterThanOrEqual((header?.height ?? 0) - 1);
  expect(save!.y + save!.height).toBeLessThan(page.viewportSize()!.height);
  await page.getByRole('button', { name: 'Импортировать', exact: false }).click();
  await page.locator('.import-dialog textarea').fill('term\t' + 'LongDefinition'.repeat(50));
  await fitsWidth(page);
  const importButton = page.locator('.import-dialog').getByRole('button', { name: 'Импортировать', exact: true });
  await expect(importButton).toBeInViewport();
  await page.getByRole('button', { name: 'Закрыть импорт' }).click();
});

test('cards can flip and rate with controls fitting the viewport', async ({ page }) => {
  await signIn(page);
  await page.goto('/module/responsive/card');
  await expect(page.getByRole('button', { name: 'Знаю', exact: true })).toBeVisible();
  if (page.viewportSize()!.height < 500) {
    await page.getByRole('button', { name: 'Знаю', exact: true }).scrollIntoViewIfNeeded();
  }
  await expect(page.getByRole('button', { name: 'Знаю', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Показать определение', exact: true }).click();
  await page.getByRole('button', { name: 'Знаю', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Отменить последний ответ' })).toBeEnabled();
  await fitsWidth(page);
});

test('test questions and results remain usable', async ({ page }) => {
  await signIn(page);
  await page.goto('/module/responsive/test');
  await page.getByLabel('Вопросы (максимум 12)').fill('4');
  for (const label of ['Верно — неверно', 'Вопросы с выбором ответа', 'Сопоставление']) {
    await page.getByLabel(label, { exact: true }).uncheck();
  }
  await page.getByRole('button', { name: 'Начать test' }).click();
  for (const input of await page.locator('input[id^="test-answer-"]').all()) await input.fill('answer');
  await fitsWidth(page);
  await page.getByRole('button', { name: 'Завершить test' }).click();
  await fitsWidth(page);
});


test('mixed test questions wrap and card state survives rotation', async ({ page }) => {
  await signIn(page);
  await page.goto('/module/stress/test');
  await page.getByRole('button', { name: 'Начать test' }).click();
  await fitsWidth(page);
  await page.goto('/module/responsive/card');
  await page.getByRole('button', { name: 'Знаю', exact: true }).click();
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: size.height, height: size.width });
  await expect(page.getByRole('button', { name: 'Отменить последний ответ' })).toBeEnabled();
  await fitsWidth(page);
  await page.setViewportSize(size);
  await page.getByRole('button', { name: 'Отменить последний ответ' }).click();
  await expect(page.getByRole('button', { name: 'Отменить последний ответ' })).toBeDisabled();
});
