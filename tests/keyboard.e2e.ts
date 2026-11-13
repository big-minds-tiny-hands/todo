import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// iOS Safari lays its keyboard over the page and only shrinks window.visualViewport. Chromium cannot open a
// phone keyboard, so this stands in a visualViewport whose height the test sets, the way iOS changes it.
const FAKE_VIEWPORT = `
  const fake = new EventTarget();
  let height = window.innerHeight;
  Object.defineProperties(fake, {
    height: { get: () => height },
    width: { get: () => window.innerWidth },
    offsetTop: { get: () => 0 },
    offsetLeft: { get: () => 0 },
    scale: { get: () => 1 },
  });
  Object.defineProperty(window, 'visualViewport', { value: fake, configurable: true });
  window.__keyboard = (px) => { height = window.innerHeight - px; fake.dispatchEvent(new Event('resize')); };
`;

test('an open phone keyboard never hides the field being typed in', { session: 'user' }, async ({ app, screen, browser }) => {
  await browser.addInitScript(FAKE_VIEWPORT);
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Demo').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('button', 'Add a task').tap();
  await expect(screen.getByRole('dialog', 'New task')).toBeVisible();
  // The sheet slides up over 0.45 s; measure where it rests.
  await new Promise((r) => setTimeout(r, 700));
  await browser.evaluate('window.__keyboard(340)');
  await new Promise((r) => setTimeout(r, 100));
  const sheetBottom = await browser.evaluate<number>("Math.round(document.querySelector('.sheet').getBoundingClientRect().bottom)");
  expect(sheetBottom).toBeLessThanOrEqual(844 - 340);
  await screen.getByLabel('Task').fill('Call the Thursday family back');
  await expect(screen.getByLabel('Task')).toBeVisible();
  await browser.evaluate('window.__keyboard(0)');
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('link', 'Today').tap();
  await screen.getByRole('link', /Rebuild case list/).tap();
  await screen.getByLabel('Notes').tap();
  await browser.evaluate('window.__keyboard(340)');
  await new Promise((r) => setTimeout(r, 100));
  await screen.getByLabel('Notes').fill(Array.from({ length: 12 }, (_, i) => `Line ${i + 1} of the intake notes`).join('\n'));
  const notesBottom = await browser.evaluate<number>("Math.round(document.getElementById('notes').getBoundingClientRect().bottom)");
  expect(notesBottom).toBeLessThanOrEqual(844 - 340 + 8);
});
