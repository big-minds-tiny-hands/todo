import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const PAINT = 'Order paint for the art room';
const PATEL = 'Call the Patel family';
const FIRE = 'Renew the fire inspection';
const TOUR = 'Book the Friday tour';

// A wrong pick never traps her: a focus task can be taken out, swapped for another Today task, sent back to
// All tasks, or opened to edit.
test('the focus set can be edited after it starts', { session: 'user' }, async ({ app, screen }) => {
  await app.open('/tasks');
  await screen.getByRole('button', 'Dev data').tap();
  await screen.getByRole('button', 'Empty').tap();
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('button', 'Add a task').tap();
  await screen.getByRole('button', 'Today').tap();
  for (const title of [PAINT, PATEL, FIRE, TOUR]) {
    await screen.getByLabel('Task').fill(title);
    await screen.getByRole('button', 'Add task').tap();
    await expect(screen.getByLabel('Task')).toHaveValue('');
  }
  await screen.getByRole('button', 'Close').tap();

  await screen.getByRole('link', 'Today').tap();
  await screen.getByRole('link', 'Choose a focus set').tap();
  for (const title of [PAINT, PATEL, FIRE]) await screen.getByRole('button', `Focus on ${title}`).tap();
  await screen.getByRole('button', 'Start focus set').tap();
  const set = screen.getByRole('region', 'Focus set');
  await expect(set.getByText('3 left')).toBeVisible();

  await set.getByRole('button', 'Edit focus set').tap();
  await set.getByRole('button', `Take ${PATEL} out of focus`).tap();
  await expect(set.getByRole('button', `Take ${PATEL} out of focus`)).toBeHidden();
  await expect(set.getByRole('button', `Pick ${PATEL}`)).toBeVisible();
  await set.getByRole('button', `Pick ${TOUR}`).tap();
  await expect(set.getByRole('link', TOUR)).toBeVisible();

  await set.getByRole('button', `Not today: ${FIRE}`).tap();
  await expect(screen.getByText('Back in All tasks')).toBeVisible();
  await expect(set.getByText(FIRE)).toBeHidden();
  await set.getByRole('button', 'Done').tap();
  await expect(set.getByText('2 left')).toBeVisible();

  await set.getByRole('link', PAINT).tap();
  await expect(screen.getByRole('textbox', 'Title')).toHaveValue(PAINT);

  await screen.getByRole('link', 'Today').tap();
  await screen.getByRole('link', /^All tasks/).tap();
  await expect(screen.getByRole('link', new RegExp(FIRE))).toBeVisible();
});
