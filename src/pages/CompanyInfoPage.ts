import { Locator, Page } from '@playwright/test';
import { CompanyData } from '../data/testData';
import { Select } from './components/Select';

/**
 * Page Object for Screen 3 — "Tell Us About Your Company".
 */
export class CompanyInfoPage {
  private readonly companySizeSelect: Select;
  private readonly heading: Locator;
  private readonly companyNameInput: Locator;
  private readonly legalAddressInput: Locator;
  private readonly taxIdInput: Locator;
  private readonly roleInput: Locator;
  private readonly messageTextarea: Locator;
  private readonly requestDemoButton: Locator;

  constructor(page: Page) {
    this.companySizeSelect = new Select(page, 'Company Size');
    this.heading = page.getByRole('heading', { name: 'Tell Us About Your Company' });
    this.companyNameInput = page.getByLabel('Company Name');
    this.legalAddressInput = page.getByLabel('Legal Address');
    this.taxIdInput = page.getByLabel('Tax ID');
    this.roleInput = page.getByLabel('Your Role');
    this.messageTextarea = page.getByLabel('Message');
    this.requestDemoButton = page.getByRole('button', { name: /request a demo/i });
  }

  async waitForPage(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
  }

  async fillAndSubmit(data: CompanyData): Promise<void> {
    await this.companyNameInput.fill(data.companyName);
    await this.companySizeSelect.select(data.companySize);
    await this.legalAddressInput.fill(data.legalAddress);
    await this.taxIdInput.fill(data.taxId);
    await this.roleInput.fill(data.role);
    await this.messageTextarea.fill(data.message);
    await this.requestDemoButton.click();
  }
}
