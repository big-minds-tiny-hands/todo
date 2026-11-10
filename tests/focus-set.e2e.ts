import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const TASK = 'Call the Thursday family back';

// The core loop: put a task on Today, make it the focus set, finish it, and get the reward.
test('a task added to Today becomes the focus set and finishing it completes the set', { session: 'user' }, async ({ app, screen }) => {
  // Start from an empty account. The dev data dock is dev only and reseeds the signed-in user.
  // All tasks has the dock and never opens a time-slot check, whatever data the account holds.
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Empty').tap();
  await screen.getByRole('button', 'Close').tap();
  // Navigate in the app: a full reload while the reseed is in flight trips the unsaved-changes guard.
  await screen.getByRole('link', 'Today').tap();
  await expect(screen.getByRole('heading', 'Put everything on your plate here')).toBeVisible();

  await screen.getByRole('button', 'Add your first task').tap();
  await screen.getByLabel('Task').fill(TASK);
  await screen.getByRole('button', 'Today').tap();
  await screen.getByRole('button', 'Add task').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('link', 'Choose a focus set').tap();
  await screen.getByRole('button', `Focus on ${TASK}`).tap();
  await screen.getByRole('button', 'Start focus set').tap();
  await expect(screen.getByRole('heading', 'Focus')).toBeVisible();
  const check = screen.getByRole('button', `Complete ${TASK}`);
  await expect(check).toBeVisible();

  await check.tap();
  await expect(screen.getByRole('heading', 'Focus set done')).toBeVisible();
  await expect(screen.getByRole('dialog', 'Focus set done').getByText('1 done today')).toBeVisible();
});
