'use strict'

/**
 * @fileoverview Forbids string interpolation (${...}) inside Cypher query
 * template literals.  Applies to:
 *   1. Any file whose name ends in -cypher.ts  — all template literals with
 *      expressions are flagged.
 *   2. All other TS/JS files — only template literals whose combined quasi
 *      text contains a Cypher keyword AND an expression are flagged.
 *
 * $paramName references (e.g. `$churchId`) are safe — they are plain dollar
 * characters inside the string, not template expressions, so the rule never
 * flags them.
 *
 * ## Static-fragment allowlist
 *
 * The optional `allowedIdentifiers` rule option exempts template expressions
 * whose only contents are Identifier references to a configured list of
 * compile-time Cypher fragments (e.g. `${ROW_RETURN}`). Such fragments are
 * declared once as `const FOO = `…``, contain NO interpolation themselves, and
 * are composed into per-query templates purely to avoid duplicating long
 * static SQL/Cypher blocks. They are equivalent to inlining and carry no
 * injection risk — but `prefer-template` blocks plain string concatenation as
 * the workaround, so we let the rule reason about them explicitly.
 *
 * Configure per-file in `.eslintrc` / package.json `overrides`:
 *
 *   {
 *     "files": ["src/foo/bar-cypher.ts"],
 *     "rules": {
 *       "fl-cypher/no-interpolated-cypher": [
 *         "error",
 *         { "allowedIdentifiers": ["ROW_RETURN", "LEADER_OPTIONALS"] }
 *       ]
 *     }
 *   }
 *
 * A template is only exempted when EVERY interpolated expression is a bare
 * Identifier listed in the allowlist. Any non-Identifier expression (member
 * access, call, ternary, even a parenthesised identifier) re-arms the rule.
 *
 * ADR-012: Cypher is parameterised; raw string interpolation is forbidden.
 * @see api/eslint-plugin-fl-cypher/
 */

const CYPHER_KEYWORD_RE =
  /\b(MATCH|MERGE|CREATE|WITH|RETURN|SET|DETACH\s+DELETE|REMOVE|WHERE|FOREACH|CALL|UNWIND|OPTIONAL\s+MATCH)\b/g

/** True when the filename indicates this is a Cypher-only file. */
function isCypherFile(filename) {
  return /-cypher\.[jt]s$/.test(filename)
}

/** Join all quasi (raw string) segments of a TemplateLiteral node. */
function joinQuasis(node) {
  return node.quasis.map((q) => q.value.cooked ?? q.value.raw).join('')
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow template-literal interpolation inside Cypher query strings (ADR-012)',
      category: 'Security',
      recommended: true,
      url: 'https://github.com/firstlovecenter/fl-admin-portal/tree/main/api/eslint-plugin-fl-cypher',
    },
    messages: {
      noCypherInterpolation:
        'String interpolation (${...}) inside a Cypher query is forbidden. ' +
        'Pass values through $param bindings and the tx.run() params object ' +
        'instead (ADR-012).',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowedIdentifiers: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
      },
    ],
  },

  create(context) {
    const filename = context.getFilename()
    const inCypherFile = isCypherFile(filename)
    const [options = {}] = context.options || []
    const allowedIdentifiers = new Set(options.allowedIdentifiers || [])

    return {
      TemplateLiteral(node) {
        // No expressions → no interpolation, nothing to flag.
        if (node.expressions.length === 0) return

        // Allow templates whose interpolations are exclusively references to
        // configured static-fragment identifiers. These are equivalent to
        // inlining the fragment text and cannot carry user input.
        if (
          allowedIdentifiers.size > 0 &&
          node.expressions.every(
            (expr) =>
              expr.type === 'Identifier' && allowedIdentifiers.has(expr.name),
          )
        ) {
          return
        }

        const rawText = joinQuasis(node)

        // For non-cypher files require at least 2 Cypher keyword matches to
        // avoid false positives on common uppercase words (SET, WITH, CALL)
        // that appear in log messages or error strings.
        const keywordMatches = rawText.match(CYPHER_KEYWORD_RE) ?? []
        if (inCypherFile || keywordMatches.length >= 2) {
          context.report({ node, messageId: 'noCypherInterpolation' })
        }
      },
    }
  },
}
