#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * CLI runner for the weekly-tip-generator Lambda. Lets you exercise the same
 * code path manually before scheduling the cron.
 *
 * Usage:
 *   node api/src/scripts/run-weekly-tip-generator.js                # all churches, real write
 *   node api/src/scripts/run-weekly-tip-generator.js --dryRun       # skip Claude + Neo4j write, just retrieve
 *   node api/src/scripts/run-weekly-tip-generator.js --church <id>  # only this Church id
 *
 * For inspecting a single church's prompt + output (without persisting),
 * prefer `preview-weekly-tip.js` — that script also prints the full LLM
 * prompt + response.
 */

const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const {
  handler,
} = require('../functions/background/weekly-tip-generator/index')

const args = process.argv.slice(2)
const getFlag = (name, fallback = undefined) => {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1) return fallback
  return args[idx + 1] || true
}

const dryRun = args.includes('--dryRun')
const onlyChurchIdFlag = getFlag('church', null)
const onlyChurchId =
  onlyChurchIdFlag === true || !onlyChurchIdFlag ? null : onlyChurchIdFlag

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Weekly tip generator (CLI wrapper).

Options:
  --dryRun                Skip Claude + Neo4j write; just verify retrieval works.
  --church <Church.id>    Run for one specific church only.
  --help, -h              Show this help.
`)
  process.exit(0)
}

;(async () => {
  try {
    const result = await handler({ dryRun, onlyChurchId })
    console.log('Result:', result)
    process.exit(0)
  } catch (error) {
    console.error('Runner failed:', error)
    process.exit(1)
  }
})()
