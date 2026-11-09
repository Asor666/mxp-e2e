/**
 * Extracts a 6-digit OTP from an email body.
 */
export function extractOtp(text: string): string {
  const match = text.match(/\b(\d{3})[\s-](\d{3})\b/);
  if (!match) throw new Error(`Could not extract OTP:\n${text}`);
  return `${match[1]}${match[2]}`;
}
