'use strict'

/**
 * eslint-plugin-fl-cypher
 *
 * Local ESLint plugin that enforces ADR-012: Cypher queries in the FL Admin
 * Portal api package must never use template-literal interpolation.
 *
 * Usage (api/package.json eslintConfig):
 *   "plugins": ["fl-cypher"],
 *   "rules":   { "fl-cypher/no-interpolated-cypher": "error" }
 *
 * Or extend the recommended config:
 *   "extends": ["plugin:fl-cypher/recommended"]
 */

const noInterpolatedCypher = require('./rules/no-interpolated-cypher')

module.exports = {
  rules: {
    'no-interpolated-cypher': noInterpolatedCypher,
  },
  configs: {
    recommended: {
      plugins: ['fl-cypher'],
      rules: {
        'fl-cypher/no-interpolated-cypher': 'error',
      },
    },
  },
}
