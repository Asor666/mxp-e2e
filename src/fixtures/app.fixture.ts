import { test as base } from '@playwright/test';
import { MailClient } from '../api/MailClient';

/**
 * Custom fixtures injected into every test that imports from this file.
 *
 *   mailbox  — a live mail.tm disposable inbox; use `mailbox.address` as the
 *              Business Email on Screen 1.
 */
export type AppFixtures = {
  mailbox: MailClient;
};

export const test = base.extend<AppFixtures>({
  mailbox: async ({}, use) => {
    const client = await MailClient.create();
    await use(client);
  },
});

export { expect } from '@playwright/test';
