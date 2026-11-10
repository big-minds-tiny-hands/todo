import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const PLANNED = 'Tour with the Okafor family';
const WAITING = 'Renew the fire inspection';

// A task put on a later day leaves the tasks to pick from: All tasks shows it under Planned, and the Today plan does not offer it.
test('a task put on tomorrow shows under Planned and not in the Today plan', { session: 'user' }, async ({ app, screen, browser }) => {
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Empty').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('button', 'Add a task').tap();
  await screen.getByLabel('Task').fill(WAITING);
  await screen.getByRole('button', 'Add task').tap();
  await expect(screen.getByText('Added to All tasks')).toBeVisible();

  await screen.getByLabel('Task').fill(PLANNED);
  await screen.getByRole('button', 'Pick a day').tap();
  const tomorrow = await browser.evaluate(`() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }`);
  await screen.getByRole('button', { name: new RegExp(`^${tomorrow}`) }).tap();
  await screen.getByRole('button', 'Add task').tap();
  await expect(screen.getByText('Added to the calendar')).toBeVisible();
  await screen.getByRole('button', 'Close').tap();

  await expect(screen.getByRole('heading', /^Planned/)).toBeVisible();
  await expect(screen.getByRole('heading', /^Tomorrow/)).toBeVisible();
  await expect(screen.getByRole('link', new RegExp(PLANNED))).toBeVisible();

  await screen.getByRole('link', 'Today').tap();
  await expect(screen.getByRole('heading', /^From All tasks/)).toBeVisible();
  await expect(screen.getByRole('button', `Add ${WAITING} to Today`)).toBeVisible();
  await expect(screen.getByRole('button', `Add ${PLANNED} to Today`)).toBeHidden();
});
