import { Page } from '@playwright/test';
import { TIMEOUTS } from '../../utils/timeouts';

/**
 * Generic custom-select / combobox component.
 */
export class Select {
  private readonly page: Page;
  private readonly label: string;

  /** @param label Accessible name of the combobox (e.g. "Company Size") */
  constructor(page: Page, label: string) {
    this.page = page;
    this.label = label;
  }

  /**
   * Opens the dropdown and selects the option that matches `optionText`.
   * @param optionText
   */
  async select(optionText: string): Promise<void> {
    const trigger = this.page.getByRole('combobox', { name: this.label });
    await trigger.click();

    // Options are rendered in a portal — wait for visibility before clicking
    const option = this.page.getByRole('option', { name: optionText });
    await option.waitFor({ state: 'visible', timeout: TIMEOUTS.s5 });
    await option.click();
  }
}
