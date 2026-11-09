import { faker } from '@faker-js/faker';
import { pollFor, sleep } from '../utils/wait';
import { TIMEOUTS } from '../utils/timeouts';
import {
  MailTmDomain,
  MailTmMessage,
  MailTmMessageSummary,
  MailTmToken,
  WaitForMessageOptions,
} from './mail.types';

const BASE = 'https://api.mail.tm';

/**
 * Thin wrapper around the mail.tm public REST API.
 * Docs: https://docs.mail.tm
 *
 * Usage:
 *   const client = await MailClient.create();
 *   console.log(client.address); // use as email in the form
 *   const msg = await client.waitForMessage({ subjectMatcher: /OTP/i });
 */
export class MailClient {
  private token: string;
  readonly address: string;

  private constructor(address: string, token: string) {
    this.address = address;
    this.token = token;
  }

  static async create(): Promise<MailClient> {
    const domain = await MailClient.pickDomain();
    const address = `mxptest${faker.string.alphanumeric({ length: 12, casing: 'lower' })}@${domain}`;
    const password = `Pw!${faker.string.alphanumeric({ length: 16, casing: 'lower' })}`;

    await MailClient.createAccount(address, password);
    const token = await MailClient.obtainToken(address, password);

    return new MailClient(address, token);
  }

  /** Polls the inbox until a matching message arrives or the timeout expires. */
  async waitForMessage(opts: WaitForMessageOptions): Promise<MailTmMessage> {
    const {
      subjectMatcher,
      excludeSubjectPattern,
      timeoutMs = TIMEOUTS.s45,
      pollMs = TIMEOUTS.s3,
    } = opts;

    return pollFor(
      async () => {
        const messages = await this.listMessages();
        const match = messages.find(
          m =>
            (!excludeSubjectPattern ||
              !MailClient.matchesSubject(m.subject, excludeSubjectPattern)) &&
            MailClient.matchesSubject(m.subject, subjectMatcher),
        );
        return match ? this.getMessage(match.id) : null;
      },
      {
        timeoutMs,
        pollMs,
        label: `email matching subject: ${subjectMatcher.toString()}`,
      },
    );
  }

  private async listMessages(): Promise<MailTmMessageSummary[]> {
    return this.get<MailTmMessageSummary[]>('/messages');
  }

  private async getMessage(id: string): Promise<MailTmMessage> {
    return this.get<MailTmMessage>(`/messages/${id}`);
  }

  private async get<T>(path: string): Promise<T> {
    return MailClient.fetchWithRetry(`${BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    });
  }

  private static async pickDomain(): Promise<string> {
    const domains = await MailClient.fetchWithRetry<MailTmDomain[]>(`${BASE}/domains`, {
      headers: { Accept: 'application/json' },
    });
    const active = domains.filter(d => d.isActive && !d.isPrivate);
    if (!active.length) throw new Error('No active public mail.tm domains found');
    return active[0].domain;
  }

  private static async createAccount(address: string, password: string): Promise<void> {
    await MailClient.fetchWithRetry<unknown>(
      `${BASE}/accounts`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ address, password }),
      },
      [201],
    );
  }

  private static async obtainToken(address: string, password: string): Promise<string> {
    const data = await MailClient.fetchWithRetry<MailTmToken>(`${BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ address, password }),
    });
    return data.token;
  }

  /**
   * Wraps fetch with exponential backoff for 429 / 5xx responses.
   */
  private static async fetchWithRetry<T>(
    url: string,
    init: RequestInit = {},
    okCodes: number[] = [200],
    retries = 3,
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        const backoff = Math.min(1000 * 2 ** attempt, 16_000);
        await sleep(backoff);
      }
      const res = await fetch(url, init);
      const ok = res.ok || okCodes.includes(res.status);
      if (ok) return res.json() as Promise<T>;

      const body = await res.text();
      lastError = new Error(`mail.tm ${init.method ?? 'GET'} ${url} → ${res.status}: ${body}`);

      if (res.status !== 429 && res.status < 500) break;
    }
    throw lastError ?? new Error(`Failed to fetch ${url}`);
  }

  private static matchesSubject(subject: string, matcher: string | RegExp): boolean {
    if (typeof matcher === 'string') {
      return subject.toLowerCase().includes(matcher.toLowerCase());
    }
    return matcher.test(subject);
  }
}
