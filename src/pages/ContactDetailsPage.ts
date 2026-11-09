import { expect, Locator, Page } from '@playwright/test';
import { ContactData } from '../data/testData';

/** Page Object for Screen 1 — "Share Your Contact Details". */
export class ContactDetailsPage {
  private readonly page: Page;
  private readonly fullNameInput: Locator;
  private readonly businessEmailInput: Locator;
  private readonly phoneInput: Locator;
  private readonly continueButton: Locator;
  private readonly heading: Locator;
  private readonly consentCheckbox: Locator;
  private readonly consentVisual: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.getByLabel('Full Name');
    this.businessEmailInput = page.getByLabel('Business Email');
    this.phoneInput = page.getByLabel('Phone Number');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.heading = page.getByRole('heading', { name: 'Share Your Contact Details' });
    this.consentCheckbox = page.getByRole('checkbox', { name: /I agree to the processing/i });
    this.consentVisual = this.consentCheckbox.locator('xpath=..');
  }

  async open(): Promise<void> {
    await this.page.goto('/get-a-demo', { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle');
    await this.heading.waitFor({ state: 'visible' });
  }

  async fillAndSubmit(data: ContactData): Promise<void> {
    await this.fullNameInput.fill(data.fullName);
    await this.businessEmailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);
    await this.checkConsent();
    await this.continueButton.click();
  }

  async waitForPage(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  private async checkConsent(): Promise<void> {
    if (!(await this.consentCheckbox.isChecked())) {
      await this.consentVisual.click();
      await expect(this.consentCheckbox).toBeChecked();
    }
  }
}
