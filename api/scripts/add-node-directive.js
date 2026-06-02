/* eslint-disable @typescript-eslint/no-var-requires */
// Spike helper — adds `@node` to every `type X { ... }` and
// `type X implements Y { ... }` line in api/src/schema/*.graphql that
// doesn't already carry a directive. Skips the `JWT @jwt` block and any
// type already annotated with @node, @jwt, or @relationshipProperties.
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'src', 'schema')
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.graphql') && !f.includes('combined'))

const TYPE_RE = /^(type\s+([A-Z][A-Za-z0-9_]*)(\s+implements\s+\w+)?)(\s*)(@[A-Za-z]+[\s\S]*?)?(\s*\{)/gm

let changed = 0
for (const file of files) {
  const filePath = path.join(dir, file)
  const original = fs.readFileSync(filePath, 'utf8')
  const updated = original.replace(
    TYPE_RE,
    (match, header, _name, _impl, _ws, existingDirective, brace) => {
      if (existingDirective) return match // already has @something
      changed += 1
      return `${header} @node${brace}`
    }
  )
  if (updated !== original) {
    fs.writeFileSync(filePath, updated)
    console.log(`updated ${file}`)
  }
}
console.log(`Total types annotated: ${changed}`)
