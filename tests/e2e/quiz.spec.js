// Lab 2 — quiz site checks.
// These are FEEDBACK, not a grade. They follow the spec from the lab page:
// answers as grouped radio buttons, a button to finish, an error if you
// haven't answered everything, and a result once you have. They don't care
// what you named your ids or classes — only that the behaviour is there.

import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// How much of the page is on screen right now. Lets us tell that something
// new appeared after a click without guessing at your class names.
const visibleCount = (page) =>
  page.evaluate(
    () => [...document.querySelectorAll('body *')].filter((el) => el.getClientRects().length > 0).length,
  );

const radios = (page) => page.locator('input[type="radio"]');
const finishButton = (page) => page.locator('button, input[type="submit"]').first();

const radioGroups = (page) =>
  radios(page).evaluateAll((els) => [...new Set(els.map((el) => el.name))]);

// Most quizzes hide the radio itself and style its label (the checkbox hack
// from the lab), so a click has to go through the label when there is one.
const pickAnswer = async (page, name, index = 0) => {
  const radio = radios(page).and(page.locator(`[name="${name}"]`)).nth(index);
  const id = await radio.getAttribute('id');
  const label = id
    ? page.locator(`label[for="${id}"]`)
    : radio.locator('xpath=ancestor::label[1]');
  if (await label.count()) await label.first().click();
  else await radio.check({ force: true });
};

test.describe('the quiz page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('index.html');
    // Your quiz is probably built after quiz.json loads, so give it a moment
    // to appear. If it never does, the individual checks below say so.
    await radios(page)
      .first()
      .waitFor({ state: 'attached', timeout: 1000 })
      .catch(() => {});
  });

  test('links a stylesheet and a javascript file', async ({ page }) => {
    expect(await page.locator('head link[rel="stylesheet"]').count()).toBeGreaterThan(0);
    expect(await page.locator('script[src]').count()).toBeGreaterThan(0);
  });

  test('builds the quiz from a JSON file', async ({ page }) => {
    const jsonResponse = page.waitForResponse((r) => r.url().endsWith('.json') && r.ok(), { timeout: 2500 });
    await page.goto('index.html');
    expect((await jsonResponse).ok()).toBeTruthy();
  });

  test('shows several answers as radio buttons, each with a name and a value', async ({ page }) => {
    expect(await radios(page).count(), 'radio inputs on the page').toBeGreaterThanOrEqual(4);
    const attrs = await radios(page).evaluateAll((els) =>
      els.map((el) => ({ name: el.getAttribute('name'), value: el.getAttribute('value') })),
    );
    expect(attrs.filter((a) => !a.name).length, 'radios missing a name attribute').toBe(0);
    expect(attrs.filter((a) => a.value === null).length, 'radios missing a value attribute').toBe(0);
  });

  test('groups answers so that picking one clears the others', async ({ page }) => {
    const counts = await radios(page).evaluateAll((els) => {
      const by = {};
      els.forEach((el) => {
        by[el.name] = (by[el.name] ?? 0) + 1;
      });
      return Object.entries(by).map(([name, n]) => ({ name, n }));
    });
    const group = counts.find((g) => g.n >= 2);
    expect(group, 'a question with at least two answers').toBeTruthy();

    await pickAnswer(page, group.name, 0);
    await pickAnswer(page, group.name, 1);

    const inGroup = radios(page).and(page.locator(`[name="${group.name}"]`));
    expect(await inGroup.nth(0).isChecked(), 'the first answer should clear when you pick another').toBeFalsy();
    expect(await inGroup.nth(1).isChecked(), 'the answer you picked should be selected').toBeTruthy();
  });

  test('every answer has a label', async ({ page }) => {
    const unlabelled = await radios(page).evaluateAll(
      (els) =>
        els.filter(
          (el) => !el.closest('label') && !(el.id && document.querySelector(`label[for="${el.id}"]`)),
        ).length,
    );
    expect(unlabelled, 'radio inputs with no label').toBe(0);
  });

  test('uses pictures somewhere in the quiz', async ({ page }) => {
    const pictures = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img').length;
      const backgrounds = [...document.querySelectorAll('body, body *')].filter(
        (el) => getComputedStyle(el).backgroundImage !== 'none',
      ).length;
      return imgs + backgrounds;
    });
    expect(pictures, '<img> tags or CSS background images').toBeGreaterThan(0);
  });

  test('has a button to finish the quiz', async ({ page }) => {
    expect(await finishButton(page).count()).toBeGreaterThan(0);
  });

  test('says something if you finish without answering', async ({ page }) => {
    const before = await visibleCount(page);
    await finishButton(page).click();
    await page.waitForTimeout(300);
    expect(await visibleCount(page), 'an error should appear').toBeGreaterThan(before);
  });

  test('reveals a result once every question is answered', async ({ page }) => {
    for (const name of await radioGroups(page)) {
      await pickAnswer(page, name, 0);
    }
    const before = await visibleCount(page);
    await finishButton(page).click();
    await page.waitForTimeout(300);
    expect(await visibleCount(page), 'a result should appear').toBeGreaterThan(before);
  });
});

test.describe('the source files', () => {
  test('index.html is a real HTML document', async () => {
    const html = await readFile(path.join(repoRoot, 'index.html'), 'utf8');
    expect(html).toMatch(/<!doctype html>/i);
  });

  test('no frameworks — this one is plain JS (jQuery is fine)', async () => {
    const html = await readFile(path.join(repoRoot, 'index.html'), 'utf8');
    expect(html).not.toMatch(/\b(react|vue|angular|svelte)\b/i);
  });
});
