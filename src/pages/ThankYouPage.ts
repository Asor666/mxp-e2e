import { expect, Locator, Page } from '@playwright/test';
import { TIMEOUTS } from '../utils/timeouts';

/** Page Object for Screen 4 — "Thank You" confirmation. */
export class ThankYouPage {
  private readonly page: Page;
  private readonly mainHeading: Locator;
  private readonly subHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainHeading = page.getByRole('heading', { name: /thank you/i });
    this.subHeading = page.getByText(/we've received your request/i);
  }

  async waitForPage(): Promise<void> {
    await this.mainHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.s20 });
  }

  async expectSuccessful(): Promise<void> {
    await expect(this.mainHeading).toBeVisible();
    await expect(this.subHeading).toBeVisible();
  }

  async expectNextStepsVisible(): Promise<void> {
    await expect(this.page.getByText(/we'll review your request/i)).toBeVisible();
    await expect(this.page.getByText(/we'll get in touch/i)).toBeVisible();
    await expect(this.page.getByText(/you'll see mxp/i)).toBeVisible();
  }
}
