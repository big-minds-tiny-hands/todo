import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Dates and times are picked with the app's own controls, never the browser's native pickers.
test('a task gets a day from the month grid and a time from the hour, minute and AM or PM menus', { session: 'user' }, async ({ app, screen, browser }) => {
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Empty').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('button', 'Add a task').tap();
  await screen.getByLabel('Task').fill('Tour with the Okafor family');
  await screen.getByRole('button', 'Pick a day').tap();
  const tomorrow = await browser.evaluate(`() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }`);
  await screen.getByRole('button', { name: new RegExp(`^${tomorrow}`) }).tap();

  await screen.getByRole('button', 'Add a time').tap();
  await screen.getByRole('combobox', 'Start time hour').tap();
  await screen.getByRole('option', '10').tap();
  await screen.getByRole('combobox', 'Start time minute').tap();
  await screen.getByRole('option', '30').tap();
  await screen.getByRole('combobox', 'Start time AM or PM').tap();
  await screen.getByRole('option', 'AM').tap();
  await expect(screen.getByRole('combobox', 'Start time hour')).toHaveText('10');

  await screen.getByRole('button', 'Add task').tap();
  await expect(screen.getByText('Added to the calendar')).toBeVisible();
  await screen.getByRole('button', 'Close').tap();
  await expect(screen.getByText('Tour with the Okafor family')).toBeVisible();
  await expect(screen.getByText(/10:30 AM/)).toBeVisible();
});
