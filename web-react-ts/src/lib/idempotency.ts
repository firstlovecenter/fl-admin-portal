/**
 * Generate a fresh client-side idempotency key for a money mutation submit.
 *
 * The PWA's Apollo retry link replays a failed mutation with the same
 * variables. The server cypher does `MERGE (transaction:AccountTransaction
 * {clientTransactionId: $clientTransactionId})` so a retry returns the
 * original transaction without firing a second balance increment
 * (ADR-005, SYN-97).
 *
 * Generate ONE id per submit attempt — call this inside `onSubmit`, NOT in
 * a `useMemo` keyed on form values. A manual second submission (user closes
 * the dialog, opens it, submits again) is intentional and gets a fresh id.
 * Only Apollo retries (which replay variables) hit the dedupe path.
 *
 * Falls back to a v4-UUID-shaped string built from `crypto.getRandomValues`
 * when `crypto.randomUUID` is unavailable (e.g. a non-HTTPS preview origin).
 */
export const newClientTransactionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // RFC 4122 v4 fallback. Sufficient for idempotency keys; not a security
  // primitive. Used only when the modern API is unavailable.
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  // eslint-disable-next-line no-bitwise
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  // eslint-disable-next-line no-bitwise
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
