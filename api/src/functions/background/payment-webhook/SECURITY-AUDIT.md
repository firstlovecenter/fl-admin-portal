# Payment Webhook — Security Audit

**File audited:** `api/src/functions/background/payment-webhook/index.js`
**Date:** 2026-05-02
**Reviewer:** Manual audit (see `security-reviewer` agent)

---

## Critical

### No Paystack HMAC signature verification

The handler only uses IP whitelisting (`whitelistIPs`) to validate that a
request is genuinely from Paystack. Paystack's documented security mechanism is
an **HMAC-SHA512 signature** sent in the `x-paystack-signature` request header.
IP whitelisting is provided by Paystack as a defence-in-depth supplement, not a
primary control — it is explicitly documented as secondary to HMAC verification.

**Impact:** Any attacker who can reach this Lambda endpoint with a crafted body
can set arbitrary `transactionStatus` values on any record they know the
`reference` for. This allows marking a failed payment as `success` (or vice
versa) without holding a valid Paystack signature.

**Fix:**

```js
const crypto = require('crypto')

const verifyPaystackSignature = (event, secret) => {
  const signature = event.headers['x-paystack-signature']
  if (!signature) return false
  const body = typeof event.body === 'string' ? event.body : JSON.stringify(event.body)
  const hash = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex')
  return hash === signature
}
```

Call `verifyPaystackSignature(event, SECRETS.PAYSTACK_SECRET_KEY)` in the
handler before `whitelistIPs`. If it returns `false`, return HTTP 401
immediately. Keep `whitelistIPs` as a secondary layer, not the primary gate.

---

## High

### `pending` status allowed to overwrite any existing status

`executeQuery` runs `setTransactionStatusPending` when Paystack sends
`status === 'pending'`. There is no guard to prevent this from transitioning a
`success` record back to `pending`. Per SM1 (`kb/04-state-machines.md`),
`success` is a terminal state — no write should ever move it backwards.

**Impact:** A Paystack `pending` event (which Paystack can fire after a
`success` event in some callback sequences) would corrupt a settled record and
re-open it for a second debit attempt.

**Fix:** In `executeQuery`, add a `WHERE` guard to each Cypher query so writes
can only happen when the current state allows it:

```js
// For setTransactionStatusSuccess — only from pending or send OTP
`MATCH (record {transactionReference: $reference})
 WHERE record:ServiceRecord OR record:Transaction OR record:RehearsalRecord
   AND record.transactionStatus IN ['pending', 'send OTP']
 SET record.transactionStatus = 'success'
 RETURN record`

// For setTransactionStatusFailed — only from pending
`...AND record.transactionStatus IN ['pending', 'send OTP']...`

// For setTransactionStatusPending — should not be accepted at all from Paystack
// Remove the 'pending' branch entirely; Paystack only sends terminal events to webhooks.
```

---

## Medium

### Error response leaks `error.message`

The catch block in the handler returns `error.message` in the HTTP 500 response
body (line ~200):

```js
body: JSON.stringify({
  message: 'Error processing payment webhook',
  error: error.message,
}),
```

**Impact:** If Neo4j throws a connection error, the message includes the Neo4j
URI, credentials context, or internal query. Paystack does not consume this
response, but it may be logged or proxied.

**Fix:** Replace with a generic string:

```js
error: 'Internal error',
```

Log the full `error` to CloudWatch (already done via `console.error`) — that
is the right place for detail.

### IP whitelisting uses `X-Forwarded-For` which can be spoofed

The `whitelistIPs` function falls back to
`event.headers['X-Forwarded-For']?.split(',')[0]` when
`requestContext.identity.sourceIp` is absent. Behind AWS API Gateway,
`requestContext.identity.sourceIp` is the authoritative client IP. `X-Forwarded-For`
is a user-controlled header and can be set by the caller.

**Impact:** An attacker can set `X-Forwarded-For: 52.31.139.75` to bypass the
IP check. This is the primary reason IP whitelisting alone is insufficient (see
Critical finding above). Once HMAC verification is in place this becomes low
severity.

**Fix:** Remove the `X-Forwarded-For` fallback; rely only on
`requestContext.identity.sourceIp`. If that is absent, reject the request.

---

## Low

### Silent no-op for unknown `status` values

If Paystack sends an event with a `status` not in `['success', 'failed',
'pending']`, `executeQuery` sets `query = ''` and calls `tx.run('')`, which
throws a Neo4j syntax error. The error is caught and logged, and the Lambda
returns 500.

**Impact:** Paystack will retry on 5xx, so this is not data-loss, but it
generates noise in CloudWatch and may prevent Paystack from reaching a
settled state for that event type.

**Fix:** Add an explicit guard:

```js
if (!['success', 'failed'].includes(status)) {
  console.log(`Ignoring non-terminal Paystack status: ${status}`)
  return null
}
```

(Drop `pending` entirely — Paystack's `charge.success` and `transfer.failed`
events are the only ones that should trigger DB writes.)

---

## What was reviewed

- Full `payment-webhook/index.js` handler
- `whitelistIPs` IP guard
- `executeQuery` Cypher writes and session lifecycle
- `handlePaystackReq` body parsing and Firebase mirror writes
- State transition correctness against SM1 (`kb/04-state-machines.md`)
- Error handling and response body exposure
- Secrets loading (`loadSecrets()` — correctly used, no `process.env` direct access)
- Session lifecycle in `executeQuery` — correctly opened and closed in `finally`
