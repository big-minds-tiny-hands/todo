import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Undo outlives the toast: a finished task unchecks from Done today, and a deleted task restores from Recently deleted.
test('a check and a delete can both be undone after their toasts are gone', { session: 'user' }, async ({ app, screen }) => {
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Empty').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('button', 'Add a task').tap();
  await screen.getByRole('button', 'Today').tap();
  for (const title of ['Order paint for the art room', 'Call the Patel family']) {
    await screen.getByLabel('Task').fill(title);
    await screen.getByRole('button', 'Add task').tap();
    await expect(screen.getByText('Added to Today')).toBeVisible();
  }
  await screen.getByRole('button', 'All tasks').tap();
  await screen.getByLabel('Task').fill('Renew the fire inspection');
  await screen.getByRole('button', 'Add task').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('link', 'Today').tap();
  await screen.getByRole('link', 'Choose a focus set').tap();
  await screen.getByRole('button', 'Focus on Order paint for the art room').tap();
  await screen.getByRole('button', 'Start focus set').tap();

  await screen.getByRole('button', '1 more task today').tap();
  await screen.getByRole('button', 'Complete Call the Patel family').tap();
  await screen.getByRole('button', '1 done today').tap();
  await screen.getByRole('button', 'Undo Call the Patel family').tap();
  await expect(screen.getByRole('button', 'Complete Call the Patel family')).toBeVisible();

  await screen.getByRole('link', /^All tasks/).tap();
  await screen.getByRole('link', /Renew the fire inspection/).tap();
  await screen.getByRole('button', 'Delete task').tap();
  await expect(screen.getByRole('button', 'Recently deleted (1)')).toBeVisible();
  await screen.getByRole('button', 'Recently deleted (1)').tap();
  await screen.getByRole('button', 'Restore Renew the fire inspection').tap();
  await expect(screen.getByRole('button', 'Recently deleted (1)')).toBeHidden();
  await expect(screen.getByRole('link', /Renew the fire inspection/)).toBeVisible();
});
