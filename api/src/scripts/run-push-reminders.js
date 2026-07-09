#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * CLI runner for the push-reminders Lambda. Exercises the same handler the
 * EventBridge schedules invoke, so a job can be verified end-to-end before
 * (and after) it is scheduled.
 *
 * Usage:
 *   node api/src/scripts/run-push-reminders.js --job service --dryRun
 *   node api/src/scripts/run-push-reminders.js --job banking --dryRun
 *   node api/src/scripts/run-push-reminders.js --job defaulters --dryRun
 *   node api/src/scripts/run-push-reminders.js --job bussing --dryRun --force
 *   node api/src/scripts/run-push-reminders.js --job service        # REAL send
 *
 * --dryRun logs the recipients + message bodies without sending, claiming
 * idempotency markers, or pruning tokens. --force (bussing only) skips the
 * Sunday guard for weekday testing. Omitting --dryRun sends REAL pushes to
 * every matching leader in the connected environment — be sure you mean it.
 */

const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { handler } = require('../functions/background/push-reminders/index')

const args = process.argv.slice(2)
const getFlag = (name, fallback = undefined) => {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1) return fallback
  return args[idx + 1] || true
}

const job = getFlag('job', null)
const dryRun = args.includes('--dryRun')
const force = args.includes('--force')

if (args.includes('--help') || args.includes('-h') || !job || job === true) {
  console.log(`
Push reminders (CLI wrapper).

Options:
  --job <service|banking|defaulters|bussing>   Which reminder job to run. Required.
  --dryRun                          Log targets + messages; send nothing.
  --force                           (bussing) skip the Sunday guard.
  --help, -h                        Show this help.
`)
  process.exit(job ? 0 : 1)
}

;(async () => {
  try {
    const result = await handler({ job, dryRun, force })
    console.log('Result:', JSON.stringify(result, null, 2))
    process.exit(result.statusCode === 200 ? 0 : 1)
  } catch (error) {
    console.error('Runner failed:', error)
    process.exit(1)
  }
})()
