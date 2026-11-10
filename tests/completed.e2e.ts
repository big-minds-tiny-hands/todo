import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const TASK = 'Send the staffing plan for Monday';

// A check on a Today row finishes the task, Completed lists it, and unchecking it there reopens it on Today.
test('a task finished from Today shows on Completed, and unchecking it reopens it', { session: 'user' }, async ({ app, screen }) => {
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Empty').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('button', 'Add a task').tap();
  await screen.getByLabel('Task').fill(TASK);
  await screen.getByRole('button', 'Today').tap();
  await screen.getByRole('button', 'Add task').tap();
  await expect(screen.getByText('Added to Today')).toBeVisible();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('link', 'Today').tap();
  await expect(screen.getByRole('button', `Not today: ${TASK}`)).toBeVisible();
  await screen.getByRole('button', `Complete ${TASK}`).tap();
  await expect(screen.getByRole('button', `Complete ${TASK}`)).toBeHidden();

  await screen.getByRole('link', /^All tasks/).tap();
  await screen.getByRole('link', /^Completed/).tap();
  await expect(screen.getByRole('heading', 'Completed')).toBeVisible();
  await expect(screen.getByRole('link', new RegExp(`^${TASK}`))).toBeVisible();

  await screen.getByRole('button', `Undo ${TASK}`).tap();
  await expect(screen.getByText('Back on Today')).toBeVisible();
  await expect(screen.getByRole('heading', 'Nothing completed yet')).toBeVisible();

  await screen.getByRole('link', 'Today').tap();
  await expect(screen.getByRole('button', `Complete ${TASK}`)).toBeVisible();
});
