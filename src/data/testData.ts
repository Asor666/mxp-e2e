import { faker } from '@faker-js/faker';

export interface ContactData {
  fullName: string;
  email: string;
  phone: string;
}

export interface CompanyData {
  companyName: string;
  companySize: CompanySize;
  legalAddress: string;
  taxId: string;
  role: string;
  message: string;
}

/**
 * Exact option labels as they appear in the live Company Size dropdown.
 */
export type CompanySize = '1\u201320' | '21\u2013100' | '100+';

const COMPANY_SIZES: CompanySize[] = ['1\u201320', '21\u2013100', '100+'];

export const testData = {
  /**
   * Builds a contact payload.
   * Pass `email` to override — required so the fixture's mailbox address is used.
   */
  contact(overrides: Partial<ContactData> & { email: string }): ContactData {
    // UAE mobile numbers: +971 followed by 5X XXXXXXX
    // Valid prefixes after +971: 50, 52, 54, 55, 56, 58
    const prefix = faker.helpers.arrayElement(['50', '52', '54', '55', '56', '58']);
    const suffix = faker.string.numeric(7);
    return {
      fullName: faker.person.fullName(),
      phone: `${prefix}${suffix}`,
      ...overrides,
    };
  },

  /** Builds a company payload with realistic-looking data. */
  company(overrides: Partial<CompanyData> = {}): CompanyData {
    const safeName = faker.company.name().replace(/[^a-zA-Z0-9 \-_'.]/g, '').trim();
    const taxId = faker.string.numeric(15);

    return {
      companyName: safeName || 'Acme Solutions',
      companySize: faker.helpers.arrayElement(COMPANY_SIZES),
      legalAddress: faker.location.streetAddress(true),
      taxId,
      role: faker.person.jobTitle(),
      message: faker.lorem.sentences(2),
      ...overrides,
    };
  },
};
