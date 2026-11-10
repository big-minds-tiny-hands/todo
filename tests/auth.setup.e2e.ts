import { test } from '@e2e-dev/web';
import { expect, credentials } from 'e2e';

test.setup('sign in as the test user', { sessions: ['user'] }, async ({ app, screen, session, browser }) => {
  const user = credentials.user('user');
  await app.open('/sign-in');
  await screen.getByLabel('Email').fill(user.username);
  await screen.getByLabel('Password').fill(user.password);
  await screen.getByRole('button', 'Sign in').tap();
  // Today can open with a time-slot check on top, so prove the sign-in by the URL and the form going away.
  await expect(browser).toHaveURL('/');
  await expect(screen.getByRole('heading', 'Sign in')).toBeHidden();
  await session.save('user');
});
