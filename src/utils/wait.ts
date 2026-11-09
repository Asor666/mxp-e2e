export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generic polling helper.
 * Calls `condition()` every `pollMs` ms until it returns a truthy value
 * or `timeoutMs` ms elapses.
 */
export async function pollFor<T>(
  condition: () => Promise<T | null | undefined | false>,
  options: { timeoutMs: number; pollMs: number; label?: string },
): Promise<T> {
  const { timeoutMs, pollMs, label = 'condition' } = options;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await condition();
    if (result) return result;
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(pollMs, remaining));
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for ${label}`);
}
