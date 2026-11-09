export interface MailTmDomain {
  domain: string;
  isActive: boolean;
  isPrivate: boolean;
}

export interface MailTmToken {
  token: string;
}

/** Subset of a message returned by GET /messages */
export interface MailTmMessageSummary {
  id: string;
  subject: string;
}

/** Full message returned by GET /messages/:id */
export interface MailTmMessage extends MailTmMessageSummary {
  text: string;
  html: string[];
}

/** Options for polling the inbox until a matching message arrives */
export interface WaitForMessageOptions {
  subjectMatcher: string | RegExp;
  excludeSubjectPattern?: string | RegExp;
  timeoutMs?: number;
  pollMs?: number;
}
