#!/usr/bin/env node
/**
 * CI enforcement for ADR-012 (SYN-172): no string-interpolated Cypher in the
 * `api` package.
 *
 * The `fl-cypher/no-interpolated-cypher` rule is registered as `error` in
 * `api/package.json` eslintConfig, but CI ran only Jest — so the control was
 * advisory. This gate re-runs ESLint over `api/src` using the project's real
 * config (so every inline `eslint-disable` directive and scoped
 * `allowedIdentifiers` override is honoured exactly as locally) and fails the
 * build iff the anti-injection rule reports a violation.
 *
 * We deliberately do NOT use `eslint --max-warnings=0` directly: the full
 * Airbnb ruleset has never gated this package in CI and would drown the build
 * in thousands of pre-existing style errors. This gate is surgical — it fails
 * ONLY on `fl-cypher/no-interpolated-cypher`, which is the acceptance
 * criterion ("CI fails on any new interpolated Cypher").
 *
 * Run locally from the repo root: `node scripts/check-cypher-lint.js`
 */

const path = require('path')
// ESLint is a root devDependency; the fl-cypher plugin + parser resolve from
// api/node_modules via the api/package.json eslintConfig overlay.
// eslint-disable-next-line import/no-extraneous-dependencies
const { ESLint } = require('eslint')

const REPO_ROOT = path.resolve(__dirname, '..')
const RULE_ID = 'fl-cypher/no-interpolated-cypher'
const TARGETS = ['api/src/**/*.ts', 'api/src/**/*.js']
// A file that is definitely linted by the api eslintConfig — used to fail
// CLOSED if the rule is not actually wired up (e.g. the fl-cypher plugin failed
// to resolve from a different cwd). Without this, a misconfigured run would lint
// with the rule absent and report a false "✓ clean".
const SENTINEL_FILE = 'api/src/resolvers/banking/banking-cypher.ts'

function isRuleEnabled(ruleEntry) {
  if (ruleEntry === undefined) return false
  const severity = Array.isArray(ruleEntry) ? ruleEntry[0] : ruleEntry
  return severity === 2 || severity === 'error'
}

async function main() {
  const eslint = new ESLint({ cwd: REPO_ROOT })

  // Fail closed: prove the anti-injection rule is actually configured for api
  // files before trusting a clean result.
  const sentinelConfig = await eslint.calculateConfigForFile(SENTINEL_FILE)
  if (!isRuleEnabled(sentinelConfig.rules && sentinelConfig.rules[RULE_ID])) {
    console.error(
      `\n✖ ${RULE_ID} is not enabled for ${SENTINEL_FILE}.\n` +
        'The gate is misconfigured (plugin/config not resolved) — refusing to\n' +
        'report a false pass. Check that `npm ci` ran in api/ (fl-cypher plugin)\n' +
        'and at the repo root (ESLint + shared config).\n'
    )
    process.exitCode = 1
    return
  }

  const results = await eslint.lintFiles(TARGETS)

  // Fail closed on any file ESLint could not parse — an unanalysable file is
  // silently exempt from the rule, which is itself a coverage hole.
  const fatals = results.flatMap((result) =>
    result.messages
      .filter((message) => message.fatal)
      .map(
        (message) =>
          `${path.relative(REPO_ROOT, result.filePath)}:${message.line || 0} ${
            message.message
          }`
      )
  )
  if (fatals.length > 0) {
    console.error(
      `\n✖ ${fatals.length} file(s) could not be parsed by ESLint (rule coverage gap):\n`
    )
    fatals.forEach((fatal) => console.error(`  ${fatal}`))
    process.exitCode = 1
    return
  }

  const violations = results.flatMap((result) =>
    result.messages
      .filter((message) => message.ruleId === RULE_ID)
      .map(
        (message) =>
          `${path.relative(REPO_ROOT, result.filePath)}:${message.line}:${
            message.column
          }`
      )
  )

  if (violations.length > 0) {
    console.error(
      `\n✖ ${violations.length} interpolated-Cypher violation(s) found (ADR-012, ${RULE_ID}):\n`
    )
    violations.forEach((violation) => console.error(`  ${violation}`))
    console.error(
      '\nPass runtime values through $param bindings and the tx.run() params object.\n' +
        'For audited compile-time static fragments, add the file to the scoped\n' +
        '`allowedIdentifiers` override in api/package.json eslintConfig, or — for\n' +
        'helper-composed builders the allowlist cannot express — add a justified,\n' +
        'reviewed `eslint-disable fl-cypher/no-interpolated-cypher` with a comment\n' +
        'explaining why no user input crosses the interpolation boundary.\n'
    )
    process.exitCode = 1
    return
  }

  console.log(`✓ No interpolated Cypher found in api/src (ADR-012, ${RULE_ID}).`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
