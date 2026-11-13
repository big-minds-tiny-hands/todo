import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const DONE = 'Send the staffing plan for Monday';
const NEXT = 'Call the Patel family';
const LATER = 'Renew the fire inspection';

// Before the first focus set, finishing a task keeps Today on the plan: the task shows under Done today, progress
// reads in words, and "+ Today" holds its row as "On Today" for a moment instead of jumping to Next focus set.
test('a task finished from the plan stays in sight and the plan keeps its pick list', { session: 'user' }, async ({ app, screen }) => {
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Empty').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('button', 'Add a task').tap();
  await screen.getByLabel('Task').fill(DONE);
  await screen.getByRole('button', 'Today').tap();
  await screen.getByRole('button', 'Add task').tap();
  await expect(screen.getByText('Added to Today')).toBeVisible();
  await screen.getByRole('button', 'All tasks').tap();
  for (const title of [NEXT, LATER]) {
    await screen.getByLabel('Task').fill(title);
    await screen.getByRole('button', 'Add task').tap();
  }
  await screen.getByRole('button', 'Close').tap();
  await expect(screen.getByText(NEXT)).toBeVisible();
  await expect(screen.getByText(LATER)).toBeVisible();

  await screen.getByRole('link', 'Today').tap();
  await expect(screen.getByRole('heading', 'Plan today')).toBeVisible();
  await screen.getByRole('button', `Complete ${DONE}`).tap();
  await expect(screen.getByRole('button', '1 done today')).toBeVisible();
  await expect(screen.getByText('2 more to win today')).toBeVisible();

  await screen.getByRole('button', `Add ${NEXT} to Today`).tap();
  await expect(screen.getByRole('button', `On Today: ${NEXT}`)).toBeDisabled();
  await expect(screen.getByRole('button', `Not today: ${NEXT}`)).toBeVisible();
  await expect(screen.getByRole('heading', 'Plan today')).toBeVisible();
  await expect(screen.getByRole('button', `Add ${LATER} to Today`)).toBeVisible();
  await expect(screen.getByRole('button', `On Today: ${NEXT}`)).toBeHidden();

  await screen.getByRole('button', '1 done today').tap();
  await expect(screen.getByRole('button', `Undo ${DONE}`)).toBeVisible();
});

// With nothing on Today, Choose a focus set offers All tasks, and starting the set puts the pick on Today.
test('a focus set can be picked from All tasks when Today is empty', { session: 'user' }, async ({ app, screen }) => {
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Empty').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('button', 'Add a task').tap();
  await screen.getByLabel('Task').fill(LATER);
  await screen.getByRole('radio', 'High').tap();
  await screen.getByRole('button', 'Add task').tap();
  await expect(screen.getByText('Added to All tasks')).toBeVisible();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('link', 'Today').tap();
  await expect(screen.getByRole('heading', 'Plan today')).toBeVisible();
  await screen.getByRole('link', 'Choose a focus set').tap();
  await expect(screen.getByText('Today is empty. Pick up to 3 from All tasks.')).toBeVisible();
  await screen.getByRole('button', `Focus on ${LATER}`).tap();
  await screen.getByRole('button', 'Start focus set').tap();

  await expect(screen.getByRole('region', 'Focus set')).toBeVisible();
  await expect(screen.getByRole('button', `Complete ${LATER}`)).toBeVisible();
});
