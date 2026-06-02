'use strict'

/**
 * RuleTester suite for fl-cypher/no-interpolated-cypher.
 *
 * Run with:
 *   node api/eslint-plugin-fl-cypher/tests/no-interpolated-cypher.test.js
 *
 * Exits 0 on success, 1 on failure.  No Jest / Vitest required — ESLint's
 * built-in RuleTester is used directly.
 */

const { RuleTester } = require('eslint')
const rule = require('../rules/no-interpolated-cypher')

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

// ---------------------------------------------------------------------------
// Helper: filename that matches a -cypher.ts file
// ---------------------------------------------------------------------------
const CYPHER_FILE = 'src/resolvers/directory/directory-cypher.ts'
const NORMAL_FILE = 'src/resolvers/directory/directory-resolvers.ts'

tester.run('no-interpolated-cypher', rule, {
  // -------------------------------------------------------------------------
  // VALID (should NOT be flagged)
  // -------------------------------------------------------------------------
  valid: [
    // 1. Cypher with $paramName only — no template expressions → safe
    {
      filename: CYPHER_FILE,
      code: `
        const query = \`
          MATCH (m:Member {id: $memberId})
          RETURN m
        \`
      `,
    },

    // 2. Template literal with expression but NO Cypher keywords → safe
    //    (e.g. URL building in a normal resolver file)
    {
      filename: NORMAL_FILE,
      code: 'const url = `https://example.com/${id}/data`',
    },

    // 3. Cypher string with NO template expressions (plain string) → safe
    {
      filename: CYPHER_FILE,
      code: `
        const query = \`
          MATCH (n:Church {id: $churchId})
          WITH n
          RETURN n
        \`
      `,
    },

    // 4. Non-Cypher template literal with expressions in a cypher-adjacent
    //    file that is not itself a -cypher.ts file → safe (no Cypher keywords)
    {
      filename: NORMAL_FILE,
      code: "const msg = `Hello, ${name}! Welcome to ${place}.`",
    },

    // 5. Template with MATCH-like text but no expressions → safe
    {
      filename: NORMAL_FILE,
      code: "const log = `MATCH result: all good`",
    },

    // 6. Log message with ambiguous uppercase keyword (WITH) + expression in a
    //    normal resolver file — must NOT be flagged (no Cypher keyword context).
    //    Documents the current heuristic: a single keyword like WITH is only
    //    flagged when found in a -cypher.ts file OR combined with other Cypher
    //    keywords in the same template literal.
    {
      filename: NORMAL_FILE,
      code: "const msg = `Querying WITH parameter ${id}`",
    },

    // 7. Uppercase SET in an error message string + expression → safe in normal file
    {
      filename: NORMAL_FILE,
      code: "const err = `SET operation failed for id: ${id}`",
    },

    // 8. allowedIdentifiers exempts a Cypher template whose interpolations
    //    are all bare references to configured static fragments.
    {
      filename: CYPHER_FILE,
      code: `
        const ROW_RETURN = \`RETURN m.id\`
        const q = \`MATCH (m:Member) \${ROW_RETURN}\`
      `,
      options: [{ allowedIdentifiers: ['ROW_RETURN'] }],
    },

    // 9. allowedIdentifiers exempts a multi-fragment composition.
    {
      filename: CYPHER_FILE,
      code: `
        const LEADERS = \`OPTIONAL MATCH (l:Leader) RETURN l\`
        const ROWS = \`RETURN m\`
        const q = \`MATCH (m:Member) \${LEADERS} \${ROWS}\`
      `,
      options: [{ allowedIdentifiers: ['LEADERS', 'ROWS'] }],
    },
  ],

  // -------------------------------------------------------------------------
  // INVALID (MUST be flagged)
  // -------------------------------------------------------------------------
  invalid: [
    // 1. Cypher keyword + expression in a -cypher.ts file
    {
      filename: CYPHER_FILE,
      code: `
        const query = \`
          MATCH (m:Member {id: \${memberId}})
          RETURN m
        \`
      `,
      errors: [{ messageId: 'noCypherInterpolation' }],
    },

    // 2. Cypher keyword + expression in a normal TS resolver file
    {
      filename: NORMAL_FILE,
      code: `
        const q = \`MATCH (n:Church {id: "\${churchId}"}) RETURN n\`
      `,
      errors: [{ messageId: 'noCypherInterpolation' }],
    },

    // 3. MERGE keyword + expression
    {
      filename: NORMAL_FILE,
      code: `
        const q = \`MERGE (n:Member {id: "\${id}"}) SET n.name = $name RETURN n\`
      `,
      errors: [{ messageId: 'noCypherInterpolation' }],
    },

    // 4. CREATE keyword + expression
    {
      filename: CYPHER_FILE,
      code: 'const q = `CREATE (n:Thing {value: ${val}}) RETURN n`',
      errors: [{ messageId: 'noCypherInterpolation' }],
    },

    // 5. WITH keyword + expression
    {
      filename: NORMAL_FILE,
      code: 'const q = `MATCH (n) WITH n, ${extra} AS x RETURN x`',
      errors: [{ messageId: 'noCypherInterpolation' }],
    },

    // 6. RETURN keyword + expression
    {
      filename: NORMAL_FILE,
      code: 'const q = `MATCH (n {id: $id}) RETURN ${field}`',
      errors: [{ messageId: 'noCypherInterpolation' }],
    },

    // 7. SET keyword + expression
    {
      filename: CYPHER_FILE,
      code: 'const q = `MATCH (n {id: $id}) SET n.${prop} = $val`',
      errors: [{ messageId: 'noCypherInterpolation' }],
    },

    // 8. Expression-only in a -cypher.ts file (no Cypher keywords needed to
    //    flag — any expression in a cypher file is an error)
    {
      filename: CYPHER_FILE,
      code: 'const q = `some text ${dynamic} value`',
      errors: [{ messageId: 'noCypherInterpolation' }],
    },

    // 9. allowedIdentifiers does NOT exempt a non-Identifier expression
    //    (e.g. property access) even when allowlisted name appears.
    {
      filename: CYPHER_FILE,
      code: `
        const obj = { ROW_RETURN: 'RETURN m' }
        const q = \`MATCH (m:Member) \${obj.ROW_RETURN}\`
      `,
      options: [{ allowedIdentifiers: ['ROW_RETURN'] }],
      errors: [{ messageId: 'noCypherInterpolation' }],
    },

    // 10. allowedIdentifiers does NOT exempt a non-allowlisted identifier.
    {
      filename: CYPHER_FILE,
      code: `
        const userInput = 'ANY THING'
        const q = \`MATCH (m:Member {id: \${userInput}}) RETURN m\`
      `,
      options: [{ allowedIdentifiers: ['ROW_RETURN'] }],
      errors: [{ messageId: 'noCypherInterpolation' }],
    },

    // 11. allowedIdentifiers requires ALL expressions to be allowlisted —
    //     a mix of an allowlisted fragment and an unsafe identifier flags.
    {
      filename: CYPHER_FILE,
      code: `
        const ROW_RETURN = 'RETURN m'
        const unsafe = 'ANY THING'
        const q = \`MATCH (m:Member {id: \${unsafe}}) \${ROW_RETURN}\`
      `,
      options: [{ allowedIdentifiers: ['ROW_RETURN'] }],
      errors: [{ messageId: 'noCypherInterpolation' }],
    },
  ],
})

console.log('All no-interpolated-cypher tests passed.')
