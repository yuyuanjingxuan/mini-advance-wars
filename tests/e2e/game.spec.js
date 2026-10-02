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

test('story mission opens briefing, starts dialogue, and resumes from autosave', async ({ page }) => {
  await page.getByRole('button', { name: /灰烬之环/ }).click();
  await expect(page.locator('#scenarioPicker')).toBeVisible();
  await expect(page.locator('#mapSettings')).toBeHidden();
  await expect(page.locator('#advancedSettings')).toBeHidden();
  await expect(page.locator('#scenarioPicker option')).toHaveCount(18);
  await expect(page.locator('#scenarioPicker option').nth(1)).toBeDisabled();

  await page.getByRole('button', { name: /开始游戏/ }).click();
  await expect(page.getByRole('dialog', { name: /第三百年的操练/ })).toBeVisible();
  await expect(page.locator('#storyPrimary')).toContainText('歼灭二连');
  await page.getByRole('button', { name: /开始作战/ }).click();
  await expect(page.getByRole('dialog', { name: /战场通讯/ })).toBeVisible();
  await page.getByRole('button', { name: /^继续$/ }).click();
  await expect(page.locator('#board .unit')).toHaveCount(8);
  await expect(page.locator('#scenarioObjective')).toContainText('歼灭二连');

  await page.reload();
  await page.getByRole('button', { name: /继续游戏/ }).click();
  await expect(page.locator('#board .unit')).toHaveCount(8);
  await expect(page.getByRole('dialog', { name: /战场通讯/ })).toBeHidden();
});

test('leaving story mode restores map and advanced match settings', async ({ page }) => {
  await page.getByRole('button', { name: /灰烬之环/ }).click();
  await expect(page.locator('#mapSettings')).toBeHidden();
  await page.getByRole('button', { name: /遭遇战/ }).click();
  await expect(page.locator('#mapSettings')).toBeVisible();
  await expect(page.locator('#advancedSettings')).toBeVisible();
});

test('story victory unlocks the next mission without erasing campaign progress', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('mini-advance-wars-campaign', JSON.stringify({ schemaVersion: 1, unlocked: [0], completed: [], endings: [], best: {}, lastMission: 0 }));
    localStorage.setItem('mini-advance-wars-save', JSON.stringify({ invalid: true }));
  });
  await page.reload();
  await page.getByRole('button', { name: /灰烬之环/ }).click();
  await page.getByRole('button', { name: /开始游戏/ }).click();
  await page.getByRole('button', { name: /开始作战/ }).click();
  await page.getByRole('button', { name: /^继续$/ }).click();
  await page.evaluate(() => {
    G.units = G.units.filter(unit => unit.side === 'P');
    checkEnd();
  });
  await expect(page.getByRole('dialog', { name: /战后报告/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /下一任务/ })).toBeVisible();
  await page.getByRole('button', { name: /下一任务/ }).click();
  await expect(page.getByRole('dialog', { name: /寻常的早晨/ })).toBeVisible();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('mini-advance-wars-campaign')));
  expect(progress.completed).toContain(0);
  expect(progress.unlocked).toContain(1);
  expect(await page.evaluate(() => localStorage.getItem('mini-advance-wars-save'))).toBeNull();
});

test('Ashen Ring briefing and core choice are fully localized in English', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('mini-advance-wars-campaign', JSON.stringify({ schemaVersion: 1, unlocked: [0, 1, 17], completed: [], endings: [], best: {}, lastMission: 1 }));
  });
  await page.reload();
  await page.locator('.langBtn[data-lang="en"]').click();
  await page.getByRole('button', { name: /The Ashen Ring/ }).click();
  await expect(page.locator('#scenarioPicker option').nth(1)).toHaveText(/An Ordinary Morning/);
  await page.locator('#scenarioPicker').selectOption('1');
  await page.getByRole('button', { name: /Start Game/ }).click();
  await expect(page.getByRole('dialog', { name: /An Ordinary Morning/ })).toBeVisible();
  await expect(page.locator('#storyAct')).toHaveText(/Act I/);
  await expect(page.locator('#storyBriefingLines')).not.toContainText(/[\u4E00-\u9FFF]/);
  await page.getByRole('button', { name: /Begin Operation/ }).click();
  await page.evaluate(() => { void runStoryEvents('roundStart', { round: 2 }); });
  await expect(page.getByRole('dialog', { name: /Battlefield Transmission/ })).toBeVisible();
  await expect(page.locator('#storyDialogueLines')).not.toContainText(/[\u4E00-\u9FFF]/);
  await page.getByRole('button', { name: /^Continue$/ }).click();

  await page.evaluate(() => {
    G.story.missionId = 17;
    G.story.flags = {};
    offerCoreChoice();
  });
  await expect(page.getByRole('dialog', { name: /The Ashen Ring/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Seal the Core/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Claim the Core/ })).toBeVisible();
});
