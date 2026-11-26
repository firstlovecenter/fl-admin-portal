import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

/**
 * SYN-289 — guards the Amplify hosting config that keeps deep links on 200 and
 * the portal out of search. Both files are config, not code: these tests read
 * them straight off disk so a careless edit (dropping an extension, adding a
 * new public/ asset type, removing the noindex header) fails CI instead of
 * silently breaking the PWA manifest or re-exposing routes to Google.
 */

const repoRoot = path.resolve(__dirname, '../../..')
const webRoot = path.resolve(__dirname, '../..')

const read = (p: string) => fs.readFileSync(p, 'utf8')

// Amplify custom rules take `</regex/>`; HCL escapes the backslash as `\\`.
const loadRewriteRule = () => {
  const tf = read(path.join(repoRoot, 'infra/terraform/amplify.tf'))
  // Anchored to line start so a `custom_rule` mention in a comment can't match.
  // Only `\\` is unescaped — enough for a regex with no quotes or newlines.
  const ruleBlock = tf.match(/^\s*custom_rule\s*\{([\s\S]*?)\n\s*\}/m)
  if (!ruleBlock) throw new Error('custom_rule block not found in amplify.tf')
  const field = (name: string) => {
    const m = ruleBlock[1].match(new RegExp(`${name}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`))
    if (!m) throw new Error(`custom_rule.${name} not found`)
    return m[1].replace(/\\\\/g, '\\')
  }
  const source = field('source')
  const inner = source.match(/^<\/(.*)\/>$/)
  if (!inner) throw new Error(`custom_rule.source is not a </regex/>: ${source}`)
  return {
    regex: new RegExp(inner[1]),
    target: field('target'),
    status: field('status'),
  }
}

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })

describe('Amplify SPA rewrite (infra/terraform/amplify.tf)', () => {
  const rule = loadRewriteRule()

  it('rewrites to /index.html with a 200, not the old 404-200 fallback', () => {
    expect(rule.target).toBe('/index.html')
    expect(rule.status).toBe('200')
  })

  // The routes behind the 14 URLs (two hosts) in the Search Console "Not found (404)" report, with and
  // without the trailing slash the old 301 added.
  const reportedRoutes = [
    '/arrivals',
    '/arrivals/bacenta',
    '/arrivals/submit-vehicle-record',
    '/arrivals/submit-mobilisation-picture',
    '/arrivals/governorship',
    '/bacenta/vehicle-details',
    '/bacenta/bussing-details',
    '/bacenta/service-details',
  ]
  it.each(reportedRoutes.flatMap((r) => [r, `${r}/`]))(
    'serves app route %s from index.html',
    (route) => {
      expect(rule.regex.test(route)).toBe(true)
    }
  )

  it('serves every declared app route from index.html', () => {
    const routeFiles = walk(path.join(webRoot, 'src')).filter((f) =>
      /Routes\.tsx?$/.test(f)
    )
    const paths = routeFiles.flatMap((f) =>
      Array.from(read(f).matchAll(/path:\s*['"]([^'"]+)['"]/g), (m) => m[1])
    )
    expect(paths.length).toBeGreaterThan(50)

    const misses = paths
      .map((p) => p.replace(/:[^/]+/g, '0b3c8e2a-1f4d-4c1e-9a7b-6d5e4f3a2b1c'))
      .filter((p) => p !== '*' && !rule.regex.test(p))
    expect(misses).toEqual([])
  })

  it.each([
    '/assets/does-not-exist.js',
    '/assets/index-abc123.css',
    '/assets/index-abc123.js.map',
    '/sw.js',
    '/index.html',
    '/manifest.json',
    '/site.webmanifest',
    '/robots.txt',
    // emitted by vite-plugin-pwa, not present in public/
    '/manifest.webmanifest',
    '/registerSW.js',
    '/workbox-abc123.js',
  ])('leaves static file %s to the origin (real 404 when missing)', (file) => {
    expect(rule.regex.test(file)).toBe(false)
  })

  // A 200 rewrite fires even when the file exists, so an extension missing
  // from the exclusion list would turn that asset into index.html.
  it('excludes every file type shipped from public/', () => {
    const publicDir = path.join(webRoot, 'public')
    const rewritten = walk(publicDir)
      .map((f) => `/${path.relative(publicDir, f).split(path.sep).join('/')}`)
      .filter((url) => rule.regex.test(url))
    expect(rewritten).toEqual([])
  })

  // Assets imported from src/ (images, fonts, media) are emitted into
  // dist/assets with their original extension.
  it('excludes every asset type imported from src/', () => {
    const sourceExt = /\.(tsx?|jsx?|css|md|snap|graphql)$/
    const rewritten = walk(path.join(webRoot, 'src'))
      .filter((f) => !sourceExt.test(f) && path.extname(f))
      .map((f) => `/assets/x${path.extname(f)}`)
      .filter((url) => rule.regex.test(url))
    expect(rewritten).toEqual([])
  })
})

describe('Amplify custom headers (customHttp.yml)', () => {
  const yml = read(path.join(repoRoot, 'customHttp.yml'))

  it('sends X-Robots-Tag: noindex, nofollow on every path', () => {
    const block = yml.match(
      /-\s*pattern:\s*'\*\*'\s*\n\s*headers:([\s\S]*?)(?=\n\s*-\s*pattern:|$)/
    )
    expect(block).not.toBeNull()
    expect(block![1]).toMatch(
      /key:\s*'X-Robots-Tag'\s*\n\s*value:\s*'noindex, nofollow'/
    )
  })

  it('keeps robots.txt permissive so crawlers can read the noindex', () => {
    const robots = read(path.join(webRoot, 'public/robots.txt'))
    // Any non-empty Disallow hides the noindex header on the paths it covers.
    expect(robots).not.toMatch(/^Disallow:[ \t]*\S/im)
  })
})
