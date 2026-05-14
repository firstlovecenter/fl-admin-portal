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
    schema: [],
  },

  create(context) {
    const filename = context.getFilename()
    const inCypherFile = isCypherFile(filename)

    return {
      TemplateLiteral(node) {
        // No expressions → no interpolation, nothing to flag.
        if (node.expressions.length === 0) return

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
