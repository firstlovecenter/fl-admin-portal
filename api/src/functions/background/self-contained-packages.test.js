/**
 * SYN-286: every background function must be self-contained.
 *
 * .github/workflows/deploy-background-functions.yml zips each folder under
 * background/ on its own and uploads it as a separate Lambda. A relative
 * import that climbs out of the folder (e.g. accra-new-members requiring
 * '../den-office-monthly-report/gsecrets.js') resolves in the monorepo
 * checkout — so tests and local runs pass — but is missing from the zip, and
 * the Lambda dies at cold start with Runtime.ImportModuleError. Only a static
 * scan catches that, so this walks every deployable source file.
 */

const fs = require('fs')
const path = require('path')

const BACKGROUND_DIR = __dirname
const SOURCE_EXT = /\.(js|ts)$/
const TEST_FILE = /\.(test|spec)\.(js|ts)$/
// require('x'), import ... from 'x', import('x') — relative specifiers only.
const RELATIVE_IMPORT =
  /(?:require\(\s*|from\s+|import\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g
const RESOLVE_SUFFIXES = ['', '.js', '.ts', '/index.js', '/index.ts']

const listSourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : listSourceFiles(full)
    }
    return SOURCE_EXT.test(entry.name) && !TEST_FILE.test(entry.name)
      ? [full]
      : []
  })

const functionDirs = fs
  .readdirSync(BACKGROUND_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const findEscapingImports = (functionDir) => {
  const root = path.join(BACKGROUND_DIR, functionDir)
  return listSourceFiles(root).flatMap((file) => {
    const source = fs.readFileSync(file, 'utf8')
    return [...source.matchAll(RELATIVE_IMPORT)]
      .map((match) => match[1])
      .filter((specifier) => {
        const target = path.resolve(path.dirname(file), specifier)
        return path.relative(root, target).startsWith('..')
      })
      .map((specifier) => `${path.relative(root, file)} -> ${specifier}`)
  })
}

const findMissingImports = (functionDir) => {
  const root = path.join(BACKGROUND_DIR, functionDir)
  return listSourceFiles(root).flatMap((file) => {
    const source = fs.readFileSync(file, 'utf8')
    return [...source.matchAll(RELATIVE_IMPORT)]
      .map((match) => match[1])
      .filter((specifier) => {
        const target = path.resolve(path.dirname(file), specifier)
        return !RESOLVE_SUFFIXES.some((suffix) =>
          fs.existsSync(`${target}${suffix}`)
        )
      })
      .map((specifier) => `${path.relative(root, file)} -> ${specifier}`)
  })
}

describe('background functions are self-contained Lambda packages', () => {
  it('finds the background function folders', () => {
    expect(functionDirs).toContain('accra-new-members')
  })

  it.each(functionDirs)(
    '%s has no relative import outside its own folder',
    (functionDir) => {
      expect(findEscapingImports(functionDir)).toEqual([])
    }
  )

  it.each(functionDirs)(
    '%s has every relative import present in its folder',
    (functionDir) => {
      expect(findMissingImports(functionDir)).toEqual([])
    }
  )
})
