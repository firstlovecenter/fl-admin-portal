/**
 * Tests for the accra-new-members background Lambda (SYN-288).
 *
 * The deployed Lambda failed every run with Runtime.ImportModuleError:
 * index.js required `../den-office-monthly-report/gsecrets.js`, but
 * .github/workflows/deploy-background-functions.yml zips each background
 * folder on its own, so that sibling file is never in the bundle and the
 * module cannot load. These tests pin three things:
 *  1. a copy of this folder, packaged the way the workflow packages it,
 *     loads in a fresh Node process (what Lambda does at init);
 *  2. no background function reaches outside its own folder, so the same
 *     class of break cannot come back in another job;
 *  3. the handler loads its secrets through this folder's own gsecrets.js.
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

jest.mock('neo4j-driver', () => ({
  driver: jest.fn(() => ({
    verifyConnectivity: jest.fn(async () => {}),
    close: jest.fn(async () => {}),
  })),
  auth: { basic: jest.fn(() => ({})) },
}))

// index.js destructures `default` from the axios module.
jest.mock('axios', () => ({
  default: jest.fn(async () => ({ data: { message: 'ok' } })),
}))

jest.mock('./gsecrets.js', () => ({
  getSecrets: jest.fn(async () => ({
    NEO4J_URI: 'bolt://localhost:7687',
    NEO4J_USER: 'neo4j',
    NEO4J_PASSWORD: 'neo4j',
    FLC_NOTIFY_KEY: 'test-notify-key',
  })),
}))

jest.mock('./utils/writeToGSheet.js', () => ({
  clearGSheet: jest.fn(async () => {}),
  writeToGsheet: jest.fn(async () => {}),
}))

jest.mock('./query-exec/newMembersList.js', () => ({
  newMembersList: jest.fn(async () => [['Stream']]),
}))

const FUNCTION_DIR = __dirname
const BACKGROUND_DIR = path.resolve(__dirname, '..')

// Mirrors the workflow, which deletes these before zipping.
const isTestFile = (name) => /\.(test|spec)\.[jt]s$/.test(name)

const listSourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : listSourceFiles(full)
    }
    return /\.[jt]s$/.test(entry.name) && !isTestFile(entry.name)
      ? [full]
      : []
  })

// Literal specifiers only; paths built at runtime (path.join) are not seen.
const RELATIVE_SPECIFIER =
  /(?:require\(\s*|from\s+|import\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g

const relativeSpecifiers = (file) =>
  [...fs.readFileSync(file, 'utf8').matchAll(RELATIVE_SPECIFIER)].map(
    (match) => match[1]
  )

describe('accra-new-members Lambda bundle (SYN-288)', () => {
  let bundleDir

  beforeAll(() => {
    // Package the folder alone, as the deploy workflow does: copy it,
    // strip tests, and give it only its own declared dependencies (stubbed,
    // since none of them are exercised at module load).
    bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'accra-new-members-'))
    fs.cpSync(FUNCTION_DIR, bundleDir, {
      recursive: true,
      filter: (src) =>
        !isTestFile(path.basename(src)) &&
        path.basename(src) !== 'node_modules',
    })

    const { dependencies } = JSON.parse(
      fs.readFileSync(path.join(FUNCTION_DIR, 'package.json'), 'utf8')
    )
    Object.keys(dependencies).forEach((dep) => {
      const depDir = path.join(bundleDir, 'node_modules', dep)
      fs.mkdirSync(depDir, { recursive: true })
      fs.writeFileSync(path.join(depDir, 'index.js'), 'module.exports = {}\n')
    })
  })

  afterAll(() => {
    fs.rmSync(bundleDir, { recursive: true, force: true })
  })

  it('loads index.js from an isolated copy of the folder, like Lambda init', () => {
    // Throws (failing the test, with the child's stderr) if any require in
    // the bundle cannot be resolved.
    const handlerType = execFileSync(
      process.execPath,
      [
        '-e',
        "const m = require('./index.js'); process.stdout.write(typeof m.handler)",
      ],
      { cwd: bundleDir, encoding: 'utf8', stdio: 'pipe', timeout: 10000 }
    )

    expect(handlerType).toBe('function')
  })
})

describe('background function folders are self-contained (SYN-288)', () => {
  const functionDirs = fs
    .readdirSync(BACKGROUND_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(BACKGROUND_DIR, entry.name))

  it.each(functionDirs.map((dir) => [path.basename(dir), dir]))(
    '%s only requires files inside its own folder',
    (_name, dir) => {
      const escapes = listSourceFiles(dir).flatMap((file) =>
        relativeSpecifiers(file)
          .filter((spec) => {
            const target = path.resolve(path.dirname(file), spec)
            return path.relative(dir, target).startsWith('..')
          })
          .map((spec) => `${path.relative(dir, file)} -> ${spec}`)
      )

      expect(escapes).toEqual([])
    }
  )
})

describe('accra-new-members handler', () => {
  it('loads secrets through its own gsecrets.js and completes', async () => {
    const { default: axios } = require('axios')
    const { getSecrets } = require('./gsecrets.js')
    const { clearGSheet, writeToGsheet } = require('./utils/writeToGSheet.js')
    const { handler } = require('./index.js')

    const result = await handler({}, {})

    expect(getSecrets).toHaveBeenCalledTimes(1)
    expect(result.statusCode).toBe(200)

    // SYN-286: completing means the sheet is rewritten and the SMS goes out
    // with the loaded notify key.
    expect(clearGSheet).toHaveBeenCalledWith('New Members')
    expect(writeToGsheet).toHaveBeenCalledWith(
      [['Stream']],
      'New Members',
      'A1:L'
    )
    const smsCall = axios.mock.calls
      .map(([config]) => config)
      .find((config) => config.url === '/send-sms')
    expect(smsCall.headers['x-secret-key']).toBe('test-notify-key')
  })

  it('returns a 500 instead of throwing when secrets cannot be loaded', async () => {
    const { getSecrets } = require('./gsecrets.js')
    getSecrets.mockRejectedValueOnce(new Error('secrets unavailable'))
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const { writeToGsheet } = require('./utils/writeToGSheet.js')
    const { handler } = require('./index.js')

    const result = await handler({}, {})

    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body).error).toBe('secrets unavailable')
    expect(writeToGsheet).not.toHaveBeenCalled()
  })
})
