import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Touch gestures, driven with real touch pointer and touch events at 120 Hz in the page. Rows and the month grid
// listen to pointer events (Motion); sheets are Base UI drawers, which read touch events.
const DRAG = `async ({ selector, dx, dy, kind }) => {
  const el = document.querySelector(selector);
  if (!el) throw new Error('no element for ' + selector);
  // A finger lands on a settled surface: wait for the sheet's or row's own transitions to finish first.
  const surface = el.closest('.sheet, .swipe, .cal') ?? el;
  await Promise.all(surface.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));
  const r = el.getBoundingClientRect();
  const x0 = r.left + r.width * 0.5, y0 = r.top + Math.min(24, r.height / 2);
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const steps = 12;
  if (kind === 'touch') {
    const at = (x, y, type) => {
      const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y });
      return new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], targetTouches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true });
    };
    el.dispatchEvent(at(x0, y0, 'touchstart'));
    for (let i = 1; i <= steps; i++) { await wait(8); el.dispatchEvent(at(x0 + (dx * i) / steps, y0 + (dy * i) / steps, 'touchmove')); }
    await wait(8);
    el.dispatchEvent(at(x0 + dx, y0 + dy, 'touchend'));
    return;
  }
  const p = (x, y, buttons) => ({ pointerType: 'touch', pointerId: 5, isPrimary: true, bubbles: true, cancelable: true, clientX: x, clientY: y, buttons });
  el.dispatchEvent(new PointerEvent('pointerdown', p(x0, y0, 1)));
  for (let i = 1; i <= steps; i++) { await wait(8); window.dispatchEvent(new PointerEvent('pointermove', p(x0 + (dx * i) / steps, y0 + (dy * i) / steps, 1))); }
  await wait(8);
  window.dispatchEvent(new PointerEvent('pointerup', p(x0 + dx, y0 + dy, 0)));
}`;

test('swipe a task onto Today, drag a sheet closed, and swipe to the next month', { session: 'user' }, async ({ app, screen, browser }) => {
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Demo').tap();
  await screen.getByRole('button', 'Close').tap();
  await expect(screen.getByRole('button', 'Add Call back new family about intake to Today')).toBeVisible();

  // Swipe right on a row: it leaves All tasks for Today.
  await browser.evaluate(DRAG, { selector: '.swipe .swipe-fg', dx: 220, dy: 0, kind: 'pointer' });
  await expect(screen.getByText('Added to Today')).toBeVisible();
  await expect(screen.getByRole('button', 'Add Call back new family about intake to Today')).toBeHidden();

  // Drag the add-task sheet down: it closes.
  await screen.getByRole('button', 'Add a task').tap();
  await expect(screen.getByRole('heading', 'New task')).toBeVisible();
  await browser.evaluate(DRAG, { selector: '.sheet .h2', dx: 0, dy: 220, kind: 'touch' });
  await expect(screen.getByRole('heading', 'New task')).toBeHidden();

  // Swipe left on the month grid: the next month comes in.
  await screen.getByRole('link', 'Calendar').tap();
  await expect(screen.getByRole('grid')).toBeVisible();
  const before = await browser.evaluate(`() => document.querySelector('.cal').getAttribute('aria-label')`);
  await browser.evaluate(DRAG, { selector: '.cal', dx: -120, dy: 0, kind: 'pointer' });
  await expect(screen.getByRole('grid', { name: before as string })).toBeHidden();
});
