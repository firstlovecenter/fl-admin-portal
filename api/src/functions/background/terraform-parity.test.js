/**
 * SYN-279: retiring a background job means removing it everywhere at once.
 *
 * A job lives in three places that nothing else ties together: its folder
 * here (zipped and deployed per-folder by deploy-background-functions.yml),
 * its `fl-synago-<folder>` Lambda in infra/terraform/locals.tf, and its
 * EventBridge schedule + import blocks in schedules.tf / imports.tf. Drop only
 * the folder and the live schedule keeps invoking the last deployed code;
 * drop only the Terraform and, once applied, the main-branch deploy fails on
 * the missing function. CI never runs terraform, so this cross-checks the .tf
 * files statically.
 */

const fs = require('fs')
const path = require('path')

const BACKGROUND_DIR = __dirname
const REPO_ROOT = path.resolve(__dirname, '../../../..')
const TERRAFORM_DIR = path.join(REPO_ROOT, 'infra/terraform')

const tfFiles = Object.fromEntries(
  fs
    .readdirSync(TERRAFORM_DIR)
    .filter((file) => file.endsWith('.tf'))
    .map((file) => [
      file,
      fs.readFileSync(path.join(TERRAFORM_DIR, file), 'utf8'),
    ])
)
const allTf = Object.values(tfFiles).join('\n')

const functionDirs = fs
  .readdirSync(BACKGROUND_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

// Jobs deployed by CI but not yet adopted into Terraform. Known drift, kept
// explicit so a NEW unmanaged job still fails here. Shrink, never grow.
const NOT_YET_IN_TERRAFORM = ['push-reminders']

// Keys of the `lambdas` map in locals.tf: `    "fl-synago-x" = {`
const lambdaKeys = [
  ...tfFiles['locals.tf'].matchAll(/^ {4}"([^"]+)" = \{/gm),
].map((match) => match[1])
// `fl-synago-graphql` and `fl-synago-graphql-dev` share the prefix but are
// not background jobs.
const backgroundLambdas = lambdaKeys.filter(
  (name) => name.startsWith('fl-synago-') && !name.includes('graphql')
)

const scheduleNames = [
  ...allTf.matchAll(/^resource "aws_scheduler_schedule" "([^"]+)"/gm),
].map((match) => match[1])

// Every `aws_lambda_function.this["x"]` anywhere: schedule targets, API
// Gateway integrations, the Function URL and the import blocks.
const lambdaRefs = [
  ...allTf.matchAll(/aws_lambda_function\.this\["([^"]+)"\]/g),
].map((match) => match[1])
const importedLambdas = [
  ...allTf.matchAll(/to = aws_lambda_function\.this\["([^"]+)"\]/g),
].map((match) => match[1])
const importedSchedules = [
  ...allTf.matchAll(/to = aws_scheduler_schedule\.([a-z0-9_]+)/g),
].map((match) => match[1])

// README step 4 lets the import blocks go once state holds everything. Until
// then they must cover every Lambda and schedule: one dropped on its own makes
// a fresh-state plan try to create a resource that is already live. (After
// step 4, a lone new import trips this too; restore the full set, which is a
// no-op for resources already in state.)
const itWhileAdopting =
  importedLambdas.length + importedSchedules.length > 0 ? it : it.skip

describe('background functions match their Terraform definitions', () => {
  it('parses the Terraform files', () => {
    expect(backgroundLambdas).toContain('fl-synago-accra-campus-weekly')
    expect(scheduleNames).toContain('accra_campus_weekly')
    expect(lambdaRefs).toContain('fl-synago-accra-campus-weekly')
  })

  it.each(functionDirs.filter((dir) => !NOT_YET_IN_TERRAFORM.includes(dir)))(
    '%s has a fl-synago-<folder> Lambda in locals.tf',
    (functionDir) => {
      expect(lambdaKeys).toContain(`fl-synago-${functionDir}`)
    }
  )

  it.each(backgroundLambdas)(
    '%s has a background function folder',
    (lambdaName) => {
      expect(functionDirs).toContain(lambdaName.replace(/^fl-synago-/, ''))
    }
  )

  it('every Lambda reference names a function declared in locals.tf', () => {
    expect(lambdaRefs.filter((name) => !lambdaKeys.includes(name))).toEqual([])
  })

  it('every schedule import block points at a declared schedule', () => {
    expect(
      importedSchedules.filter((name) => !scheduleNames.includes(name))
    ).toEqual([])
  })

  itWhileAdopting('every Lambda and schedule has an import block', () => {
    expect(
      lambdaKeys.filter((name) => !importedLambdas.includes(name))
    ).toEqual([])
    expect(
      scheduleNames.filter((name) => !importedSchedules.includes(name))
    ).toEqual([])
  })
})

describe('services-not-banked is retired (SYN-279)', () => {
  // Its Google Sheet no longer exists, so every weekly run failed with
  // "Requested entity was not found". The report was retired, not repointed.
  it('has no function folder', () => {
    expect(functionDirs).not.toContain('services-not-banked')
  })

  it.each(Object.keys(tfFiles))('is not declared in %s', (file) => {
    expect(tfFiles[file]).not.toMatch(/services[-_]not[-_]banked/)
  })

  it('has no secrets file built for it or its gsheets- predecessor', () => {
    const encryptSecrets = fs.readFileSync(
      path.join(REPO_ROOT, 'scripts/encrypt-secrets.js'),
      'utf8'
    )
    expect(encryptSecrets).toContain('secrets.build(')
    expect(encryptSecrets).not.toMatch(/services-not-banked/)
  })
})
