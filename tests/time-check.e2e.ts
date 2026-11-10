import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const TASK = 'Call the bank back';

test('a task picked for Today after its time has passed is not asked about', { session: 'user' }, async ({ app, screen }) => {
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Empty').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('button', 'Add a task').tap();
  await screen.getByLabel('Task').fill(TASK);
  await screen.getByRole('button', 'Today').tap();
  await screen.getByRole('button', 'Add a time').tap();
  await screen.getByRole('combobox', 'Start time hour').tap();
  await screen.getByRole('option', '12').tap();
  await screen.getByRole('combobox', 'Start time minute').tap();
  await screen.getByRole('option', '00').tap();
  await screen.getByRole('combobox', 'Start time AM or PM').tap();
  await screen.getByRole('option', 'AM').tap();
  await screen.getByRole('button', 'Add task').tap();
  await expect(screen.getByText('Added to Today')).toBeVisible();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('link', 'Today').tap();
  await expect(screen.getByRole('heading', 'Plan today')).toBeVisible();
  await expect(screen.getByRole('button', 'Yes, done')).toBeHidden();
  await expect(screen.getByText(TASK)).toBeVisible();
});
