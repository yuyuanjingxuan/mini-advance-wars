const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/index.html');
});

test('keyboard navigation and accessible dialogs work', async ({ page }) => {
  await page.getByRole('button', { name: /战术学院/ }).click();
  await page.getByRole('button', { name: /开始游戏/ }).click();
  const first = page.locator('.cell[tabindex="0"]');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.cell[data-x="1"][data-y="0"]')).toBeFocused();
  await page.getByRole('button', { name: /帮助/ }).click();
  await expect(page.getByRole('dialog', { name: /游戏说明/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /游戏说明/ })).toBeHidden();
});

test('language preference persists after reload', async ({ page }) => {
  await page.locator('.langBtn[data-lang="en"]').click();
  await expect(page).toHaveTitle(/Mini Advance Wars/);
  await page.reload();
  await expect(page).toHaveTitle(/Mini Advance Wars/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.langBtn[data-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
});

test('opening menu keeps advanced options collapsed', async ({ page }) => {
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('.quick-guide')).toBeVisible();
  await expect(page.locator('.advanced-options')).not.toHaveAttribute('open', '');
  await expect(page.locator('[data-ai="balanced"]')).not.toBeVisible();
  await page.locator('.advanced-options summary').click();
  await expect(page.locator('[data-ai="balanced"]')).toBeVisible();
});

test('mobile board remains usable and audio settings persist independently', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#bgmVolume').fill('30');
  await page.locator('#sfxVolume').fill('90');
  await page.reload();
  await expect(page.locator('#bgmVolume')).toHaveValue('30');
  await expect(page.locator('#sfxVolume')).toHaveValue('90');
  await page.getByRole('button', { name: /战术学院/ }).click();
  await page.getByRole('button', { name: /开始游戏/ }).click();
  await page.on('dialog', dialog => dialog.accept());
  await page.locator('#menuBtn').click();
  await expect(page.locator('#deleteSaveBtn')).toBeVisible();
  await page.locator('#deleteSaveBtn').click();
  await page.reload();
  await expect(page.locator('#bgmVolume')).toHaveValue('30');
  await expect(page.locator('#sfxVolume')).toHaveValue('90');
  await page.getByRole('button', { name: /战术学院/ }).click();
  await page.getByRole('button', { name: /开始游戏/ }).click();
  await expect(page.locator('.cell').first()).toHaveCSS('min-width', '36px');
  await expect(page.locator('#boardWrap')).toHaveCSS('overflow-x', 'auto');
});
