# MXP Net — Playwright E2E Test Suite

Automated end-to-end test for the **Get a Demo** registration flow at [https://mxp.net/get-a-demo](https://mxp.net/get-a-demo).

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers (Chromium only)
npx playwright install chromium

# 3. Run the test
npx playwright test

# 4. Open the HTML report
npx playwright show-report
```

No `.env` file or configuration needed — all constants are inlined in the code.

---

## Project structure

```
mxp/
├── playwright.config.ts
├── eslint.config.mjs
├── src/
│   ├── api/
│   │   ├── MailClient.ts           # mail.tm REST client (disposable inboxes)
│   │   └── mail.types.ts           # Minimal types for mail.tm responses
│   ├── data/
│   │   └── testData.ts             # Faker-based test data builders
│   ├── fixtures/
│   │   └── app.fixture.ts          # Custom fixture: mailbox (MailClient)
│   ├── pages/
│   │   ├── ContactDetailsPage.ts   # Screen 1 — contact form
│   │   ├── VerifyEmailPage.ts      # Screen 2 — OTP verification
│   │   ├── CompanyInfoPage.ts      # Screen 3 — company info form
│   │   ├── ThankYouPage.ts         # Screen 4 — confirmation
│   │   └── components/
│   │       └── Select.ts           # Custom combobox / dropdown widget
│   └── utils/
│       ├── otp.ts                  # Extracts 6-digit OTP from email text
│       ├── timeouts.ts             # Shared timeout constants (s3 / s5 / s20 / s45)
│       └── wait.ts                 # pollFor + sleep helpers
└── tests/
    └── request-demo.positive.spec.ts
```

---

## Design pattern — Page Object Model

Each screen is a plain class. The `page` Playwright instance is injected via constructor and stored as a private field. Locators are `private readonly` fields initialised in the constructor — the [Playwright-recommended style](https://playwright.dev/docs/pom).

`Select` is extracted as a reusable component because the Company Size dropdown is a custom Vue combobox (`role="combobox"` + portal-rendered `role="option"`) that requires non-trivial interaction logic.

The test spec orchestrates the four screens directly — no additional orchestrator layer:

```ts
await screen1.open();
await screen1.fillAndSubmit(contact);
await screen2.waitForPage();

const message = await mailbox.waitForMessage({ subjectMatcher: /verify|otp/i });
const otp = extractOtp(message.text ?? message.html.join('\n'));

await screen2.enterOtpAndVerify(otp);
await screen3.waitForPage();
await screen3.fillAndSubmit(company);
await screen4.waitForPage();
await screen4.expectSuccessful();
await screen4.expectNextStepsVisible();
```

---

## Email interception — mail.tm

The suite uses [mail.tm](https://mail.tm) — a free disposable email service with an official REST API (no key required).

**Flow:**
1. `MailClient.create()` picks an active public domain, registers a fresh random inbox, and obtains a JWT token.
2. The generated address is used as the Business Email on Screen 1.
3. `mailbox.waitForMessage({ subjectMatcher })` polls `GET /messages` every 3 s (up to 45 s) until a matching message arrives.
4. `extractOtp(body)` parses the 6-digit code — expected format: `"448 684"` or `"448-684"` (space / dash separated).

All requests use exponential backoff (2 s → 4 s → 8 s) to handle mail.tm rate limits gracefully.

---

## Selector strategy

Selectors follow the [Playwright recommended priority](https://playwright.dev/docs/best-practices#use-locators):

1. `getByRole` / `getByLabel` — accessibility tree (most resilient)
2. `getByText` — user-visible copy
3. `locator('xpath=..')` — parent traversal, used only for the consent checkbox whose `<label>` contains inline links that intercept clicks

---

## Notable implementation details

**OTP input** — the widget is 6 separate `<input>` cells. Cell 1 has `maxlength=6` and `autocomplete="one-time-code"`; Vue auto-advances focus on each `keydown`. `pressSequentially()` is required — `fill()` sets value atomically without keydown events, breaking auto-advance.

**Consent checkbox** — the native input has `appearance-none` and cannot be clicked directly. The visible `<span>` wrapper is clicked instead, scoped via `consentCheckbox.locator('xpath=..')` to this specific checkbox.

**Company Size options** — values use en-dashes (`–`, U+2013), not hyphens. The `CompanySize` type enforces this at compile time.

**Vue hydration** — `ContactDetailsPage.open()` navigates with `domcontentloaded` then explicitly calls `waitForLoadState('networkidle')`. Vue 3 loads route chunks asynchronously after `load`; without waiting for hydration, `fill()` calls run before `v-model` listeners are attached and Vue resets the inputs on mount.
