import { Locator, Page } from '@playwright/test';
/**
 * Page Object for Screen 2 — "Verify Your Email".
 */
export class VerifyEmailPage {
  private readonly heading: Locator;
  private readonly verifyButton: Locator;
  private readonly otpFirstCell: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: 'Verify Your Email' });
    this.verifyButton = page.getByRole('button', { name: /verify & continue/i });
    this.otpFirstCell = page.getByRole('textbox', { name: '1 ' });
  }

  async waitForPage(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
  }

  async enterOtpAndVerify(code: string): Promise<void> {
    await this.otpFirstCell.click();
    await this.otpFirstCell.pressSequentially(code);
    await this.verifyButton.click();
  }
}
