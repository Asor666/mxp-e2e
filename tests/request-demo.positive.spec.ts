/**
 * Positive scenario: "Request a Demo" registration flow
 *
 * Flow:
 *   Screen 1 — Share Your Contact Details
 *   Screen 2 — Verify Your Email (OTP from disposable inbox)
 *   Screen 3 — Tell Us About Your Company
 *   Screen 4 — Thank You
 *   Email assertion — confirmation email body
 */

import { test, expect } from '../src/fixtures/app.fixture';
import { testData } from '../src/data/testData';
import { extractOtp } from '../src/utils/otp';
import { ContactDetailsPage } from '../src/pages/ContactDetailsPage';
import { VerifyEmailPage } from '../src/pages/VerifyEmailPage';
import { CompanyInfoPage } from '../src/pages/CompanyInfoPage';
import { ThankYouPage } from '../src/pages/ThankYouPage';

test.describe('Get a Demo — positive registration flow', () => {
  test(
    'should complete all 4 steps and receive a confirmation email',
    { tag: ['@positive', '@smoke'] },
    async ({ page, mailbox }) => {
      const contact = testData.contact({ email: mailbox.address });
      const company = testData.company();

      const screen1 = new ContactDetailsPage(page);
      const screen2 = new VerifyEmailPage(page);
      const screen3 = new CompanyInfoPage(page);
      const screen4 = new ThankYouPage(page);

      // ------------------------------------------------------------ screen 1
      await test.step('Open the demo form', async () => {
        await screen1.open();
      });

      await test.step('Submit contact details', async () => {
        await screen1.fillAndSubmit(contact);
        await screen2.waitForPage();
      });

      // ------------------------------------------------------------ screen 2
      let otp = '';
      await test.step('Retrieve OTP from email', async () => {
        const message = await mailbox.waitForMessage({
          subjectMatcher: /verify|verification|otp|code/i,
        });
        const body = message.text ?? message.html.join('\n');
        otp = extractOtp(body);
      });

      await test.step('Verify email with OTP', async () => {
        await screen2.enterOtpAndVerify(otp);
        await screen3.waitForPage();
      });

      // ------------------------------------------------------------ screen 3
      await test.step('Submit company information', async () => {
        await screen3.fillAndSubmit(company);
        await screen4.waitForPage();
      });

      // ------------------------------------------------------------ screen 4
      await test.step('Assert Thank You screen', async () => {
        await screen4.expectSuccessful();
        await screen4.expectNextStepsVisible();
      });

      // -------------------------------------------------- confirmation email
      await test.step('Assert confirmation email received', async () => {
        const message = await mailbox.waitForMessage({
          subjectMatcher: /we received your request|thank you|request received/i,
          excludeSubjectPattern: /verify your email/i,
          timeoutMs: 60_000,
        });
        const body = message.text ?? message.html.join('\n');
        expect(body, 'Confirmation email should thank the user').toMatch(
          /thank you for reaching out to mxp/i,
        );

        const firstName = contact.fullName.split(' ')[0];
        expect(body, `Confirmation email should address ${firstName}`).toMatch(
          new RegExp(firstName, 'i'),
        );
      });
    },
  );
});
