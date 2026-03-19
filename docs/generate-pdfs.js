/**
 * Generates PDF versions of the checkins documentation.
 * Uses `marked` (already in web-react-ts/node_modules) for MD→HTML conversion,
 * then Chrome headless for HTML→PDF.
 *
 * Run from the repo root:
 *   node docs/generate-pdfs.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Use marked from the api's node_modules
const { marked } = require('../api/node_modules/marked')

const CHROME =
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

const DOCS_DIR = path.join(__dirname)

// ─── Shared CSS reset + utilities ────────────────────────────────────────────

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { margin: 0; }
`

// ─── Executive Summary styles ────────────────────────────────────────────────

const EXEC_CSS = `
  ${BASE_CSS}

  :root {
    --brand:       #1B3A6B;
    --brand-light: #2D5BA3;
    --accent:      #E8A020;
    --text:        #1a1a2e;
    --muted:       #5a6478;
    --rule:        #dce3ef;
    --bg-section:  #f4f7fc;
    --white:       #ffffff;
  }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.65;
    color: var(--text);
    background: var(--white);
  }

  /* ── Cover page ── */
  .cover {
    background: var(--brand);
    color: var(--white);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px 72px;
    page-break-after: always;
  }
  .cover-eyebrow {
    font-size: 9pt;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 28px;
  }
  .cover-title {
    font-size: 36pt;
    font-weight: 700;
    line-height: 1.15;
    margin-bottom: 20px;
  }
  .cover-subtitle {
    font-size: 13pt;
    color: rgba(255,255,255,0.72);
    margin-bottom: 60px;
    font-style: italic;
  }
  .cover-divider {
    width: 64px;
    height: 4px;
    background: var(--accent);
    margin-bottom: 36px;
  }
  .cover-meta {
    font-size: 9.5pt;
    color: rgba(255,255,255,0.55);
  }

  /* ── Content pages ── */
  .content {
    padding: 56px 72px;
    max-width: 780px;
    margin: 0 auto;
  }

  h2 {
    font-size: 16pt;
    font-weight: 700;
    color: var(--brand);
    margin: 44px 0 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--rule);
  }
  h2:first-child { margin-top: 0; }

  h3 {
    font-size: 12pt;
    font-weight: 700;
    color: var(--brand-light);
    margin: 28px 0 10px;
  }

  p { margin-bottom: 12px; }

  ul, ol {
    padding-left: 22px;
    margin-bottom: 14px;
  }
  li { margin-bottom: 6px; }

  strong { color: var(--brand); font-weight: 600; }
  em { color: var(--muted); }

  hr {
    border: none;
    border-top: 1px solid var(--rule);
    margin: 32px 0;
  }

  /* Step boxes */
  h3 + p, h3 + p + p {
    background: var(--bg-section);
    border-left: 4px solid var(--brand-light);
    padding: 12px 16px;
    border-radius: 0 6px 6px 0;
    margin-bottom: 10px;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0 24px;
    font-size: 10pt;
  }
  thead tr {
    background: var(--brand);
    color: var(--white);
  }
  thead th {
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
  }
  tbody tr:nth-child(even) { background: var(--bg-section); }
  tbody td {
    padding: 9px 14px;
    border-bottom: 1px solid var(--rule);
    vertical-align: top;
  }

  /* Option labels (Option A / B / C) */
  p > strong:first-child {
    display: inline-block;
    background: var(--brand-light);
    color: var(--white);
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 9pt;
    margin-bottom: 4px;
  }

  /* Summary callout */
  .summary-box {
    background: var(--brand);
    color: var(--white);
    border-radius: 8px;
    padding: 28px 32px;
    margin-top: 32px;
  }
  .summary-box p { color: rgba(255,255,255,0.9); margin-bottom: 8px; }
  .summary-box p:last-child { margin-bottom: 0; }
`

// ─── Technical doc styles ─────────────────────────────────────────────────────

const TECH_CSS = `
  ${BASE_CSS}

  :root {
    --brand:       #1B3A6B;
    --brand-light: #2D5BA3;
    --accent:      #E8A020;
    --text:        #1a1a2e;
    --muted:       #5a6478;
    --rule:        #dce3ef;
    --bg-code:     #f0f4f9;
    --bg-section:  #f8fafd;
    --white:       #ffffff;
  }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 9.5pt;
    line-height: 1.6;
    color: var(--text);
    background: var(--white);
  }

  /* ── Cover page ── */
  .cover {
    background: linear-gradient(145deg, #0f2444 0%, #1B3A6B 60%, #2D5BA3 100%);
    color: var(--white);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px 72px;
    page-break-after: always;
  }
  .cover-eyebrow {
    font-size: 8.5pt;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 24px;
  }
  .cover-title {
    font-size: 30pt;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 16px;
  }
  .cover-subtitle {
    font-size: 12pt;
    color: rgba(255,255,255,0.65);
    margin-bottom: 52px;
    font-style: italic;
  }
  .cover-divider {
    width: 56px;
    height: 4px;
    background: var(--accent);
    margin-bottom: 32px;
  }
  .cover-meta {
    font-size: 9pt;
    color: rgba(255,255,255,0.5);
  }
  .cover-toc {
    margin-top: 48px;
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: 32px;
  }
  .cover-toc-title {
    font-size: 8.5pt;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 14px;
  }
  .cover-toc ul {
    list-style: none;
    padding: 0;
    columns: 2;
    gap: 24px;
  }
  .cover-toc li {
    font-size: 9.5pt;
    color: rgba(255,255,255,0.75);
    margin-bottom: 6px;
    padding-left: 12px;
    border-left: 2px solid var(--accent);
  }

  /* ── Content ── */
  .content {
    padding: 48px 64px;
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    font-size: 22pt;
    font-weight: 700;
    color: var(--brand);
    margin-bottom: 6px;
    padding-bottom: 10px;
    border-bottom: 3px solid var(--brand);
  }

  h2 {
    font-size: 14pt;
    font-weight: 700;
    color: var(--white);
    background: var(--brand);
    padding: 8px 16px;
    margin: 36px -8px 16px;
    border-radius: 4px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 11pt;
    font-weight: 700;
    color: var(--brand-light);
    margin: 24px 0 8px;
    padding-left: 10px;
    border-left: 3px solid var(--accent);
    page-break-after: avoid;
  }

  h4 {
    font-size: 10pt;
    font-weight: 600;
    color: var(--brand);
    margin: 16px 0 6px;
  }

  p { margin-bottom: 10px; }

  ul, ol {
    padding-left: 20px;
    margin-bottom: 12px;
  }
  li { margin-bottom: 4px; }

  strong { font-weight: 600; color: var(--brand); }
  em { color: var(--muted); font-style: italic; }

  code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.5pt;
    background: var(--bg-code);
    padding: 1px 5px;
    border-radius: 3px;
    color: #c7254e;
  }

  pre {
    background: #1e2a3a;
    color: #e2e8f0;
    padding: 14px 18px;
    border-radius: 6px;
    font-size: 8pt;
    overflow: hidden;
    margin: 12px 0 16px;
    font-family: 'Consolas', monospace;
  }
  pre code { background: none; color: inherit; padding: 0; }

  hr {
    border: none;
    border-top: 1px solid var(--rule);
    margin: 28px 0;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 18px;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }
  thead tr { background: var(--brand-light); color: var(--white); }
  thead th {
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
  }
  tbody tr:nth-child(even) { background: var(--bg-section); }
  tbody td {
    padding: 7px 12px;
    border-bottom: 1px solid var(--rule);
    vertical-align: top;
  }
  tbody td:first-child { font-weight: 500; }

  /* Part headers (## Part N) */
  h2[data-part] {
    page-break-before: always;
  }

  /* File reference table — monospace first column */
  .file-table td:first-child, .file-table td:nth-child(2) {
    font-family: 'Consolas', monospace;
    font-size: 7.5pt;
    color: #c7254e;
  }

  /* Callout block */
  blockquote {
    border-left: 4px solid var(--accent);
    background: #fffbf0;
    padding: 12px 16px;
    margin: 14px 0;
    border-radius: 0 6px 6px 0;
    font-size: 9pt;
  }
`

// ─── HTML wrapper builders ────────────────────────────────────────────────────

function buildExecHtml(mdContent) {
  const body = marked.parse(mdContent)

  // Split off the H1 title and subtitle italic for the cover
  const titleMatch = body.match(/<h1[^>]*>(.*?)<\/h1>/s)
  const subMatch = body.match(/<p><em>(.*?)<\/em><\/p>/)
  const title = titleMatch ? titleMatch[1] : 'Digital Check-In System'
  const sub = subMatch ? subMatch[1] : 'For Church Leadership'

  // Strip the H1 and subtitle from the body
  let bodyClean = body
    .replace(/<h1[^>]*>.*?<\/h1>/s, '')
    .replace(/<p><em>.*?<\/em><\/p>/, '')
    .replace(/<hr\s*\/?>/i, '') // remove the first <hr> after subtitle

  // Wrap the last h2 (## Summary) section in a callout box
  bodyClean = bodyClean.replace(
    /(<h2[^>]*>Summary<\/h2>)([\s\S]*)$/,
    '<div class="summary-box">$1$2</div>'
  )

  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${EXEC_CSS}</style>
</head>
<body>
  <div class="cover">
    <div class="cover-eyebrow">First Love Church &mdash; Admin Portal</div>
    <h1 class="cover-title">${title}</h1>
    <p class="cover-subtitle">${sub}</p>
    <div class="cover-divider"></div>
    <p class="cover-meta">Prepared for Church Leadership &bull; ${date}</p>
  </div>
  <div class="content">
    ${bodyClean}
  </div>
</body>
</html>`
}

function buildTechHtml(mdContent) {
  const body = marked.parse(mdContent)

  const titleMatch = body.match(/<h1[^>]*>(.*?)<\/h1>/s)
  const title = titleMatch ? titleMatch[1] : 'Check-In Feature — Full Walkthrough'

  let bodyClean = body.replace(/<h1[^>]*>.*?<\/h1>/s, '')

  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Build a lightweight TOC from h2 headings
  const h2matches = [...body.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs)]
  const tocItems = h2matches
    .map((m) => `<li>${m[1].replace(/<[^>]+>/g, '')}</li>`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${TECH_CSS}</style>
</head>
<body>
  <div class="cover">
    <div class="cover-eyebrow">First Love Church &mdash; Admin Portal &mdash; Technical Reference</div>
    <h1 class="cover-title">${title}</h1>
    <p class="cover-subtitle">Implementation guide for the leader check-in system</p>
    <div class="cover-divider"></div>
    <p class="cover-meta">Internal documentation &bull; ${date}</p>
    <div class="cover-toc">
      <div class="cover-toc-title">Contents</div>
      <ul>${tocItems}</ul>
    </div>
  </div>
  <div class="content">
    ${bodyClean}
  </div>
</body>
</html>`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function generatePdf(htmlPath, pdfPath) {
  const cmd = [
    `"${CHROME}"`,
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--run-all-compositor-stages-before-draw',
    `--print-to-pdf="${pdfPath}"`,
    '--print-to-pdf-no-header',
    `"file:///${htmlPath.replace(/\\/g, '/')}"`,
  ].join(' ')

  console.log(`  Generating: ${path.basename(pdfPath)}`)
  execSync(cmd, { stdio: 'pipe' })
}

try {
  // 1. Executive Summary
  const execMd = fs.readFileSync(
    path.join(DOCS_DIR, 'CHECKINS_EXECUTIVE_SUMMARY.md'),
    'utf8'
  )
  const execHtml = buildExecHtml(execMd)
  const execHtmlPath = path.join(DOCS_DIR, '_exec_summary.html')
  const execPdfPath = path.join(DOCS_DIR, 'CHECKINS_EXECUTIVE_SUMMARY.pdf')
  fs.writeFileSync(execHtmlPath, execHtml)
  generatePdf(execHtmlPath, execPdfPath)
  fs.unlinkSync(execHtmlPath)
  console.log(`  ✓  ${execPdfPath}`)

  // 2. Technical Walkthrough
  const techMd = fs.readFileSync(
    path.join(DOCS_DIR, 'CHECKINS_FEATURE.md'),
    'utf8'
  )
  const techHtml = buildTechHtml(techMd)
  const techHtmlPath = path.join(DOCS_DIR, '_tech_feature.html')
  const techPdfPath = path.join(DOCS_DIR, 'CHECKINS_FEATURE.pdf')
  fs.writeFileSync(techHtmlPath, techHtml)
  generatePdf(techHtmlPath, techPdfPath)
  fs.unlinkSync(techHtmlPath)
  console.log(`  ✓  ${techPdfPath}`)

  console.log('\nDone. PDFs saved to docs/')
} catch (err) {
  console.error('Error:', err.message)
  process.exit(1)
}
