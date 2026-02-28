// Lambda entry point - re-exports the graphql handler
const { handler } = require('./graphql')

exports.handler = handler
