import {
  GraphQLError,
  Kind,
  type ASTNode,
  type DefinitionNode,
  type FragmentDefinitionNode,
  type OperationDefinitionNode,
  type ValidationContext,
  type ValidationRule,
} from 'graphql'

// SYN-177 — query depth guard.
//
// `@neo4j/graphql` auto-generates the schema, so any authenticated caller can
// craft an arbitrarily deep relationship-traversal query
// (`streams { councils { governorships { bacentas { members { … } } } } }`)
// and force the engine into an enormous Cypher expansion — a cheap DoS lever.
// Apollo ships no depth guard, so we add one as a validation rule that runs
// before execution.
//
// The limit is deliberately generous: the deepest query the frontend actually
// sends nests ~8–9 selection levels, so 15 leaves ~2× headroom for legitimate
// hierarchy queries while still blocking pathological nesting.
//
// Introspection meta-fields (`__schema`, `__type`, `__typename`) are exempt —
// the standard introspection query is legitimately deep, and introspection is
// separately disabled in production at the server bootstrap.
//
// Implementation follows the well-tested `graphql-depth-limit` algorithm
// (Andrew Carlson, MIT) — reimplemented here, typed, with a cyclic-fragment
// guard so a malformed fragment cycle can't spin the crawler.
export const DEFAULT_MAX_QUERY_DEPTH = 15

const getFragments = (
  definitions: ReadonlyArray<DefinitionNode>
): Record<string, FragmentDefinitionNode> => {
  const map: Record<string, FragmentDefinitionNode> = {}
  definitions.forEach((def) => {
    if (def.kind === Kind.FRAGMENT_DEFINITION) {
      map[def.name.value] = def
    }
  })
  return map
}

const getOperations = (
  definitions: ReadonlyArray<DefinitionNode>
): OperationDefinitionNode[] =>
  definitions.filter(
    (def): def is OperationDefinitionNode =>
      def.kind === Kind.OPERATION_DEFINITION
  )

const determineDepth = (
  node: ASTNode,
  fragments: Record<string, FragmentDefinitionNode>,
  depthSoFar: number,
  maxDepth: number,
  context: ValidationContext,
  operationName: string,
  seenFragments: Set<string>
): number => {
  if (depthSoFar > maxDepth) {
    context.reportError(
      new GraphQLError(
        `Query is too deep: "${operationName}" exceeds the maximum operation depth of ${maxDepth}.`,
        { nodes: [node] }
      )
    )
    return depthSoFar
  }

  switch (node.kind) {
    case Kind.FIELD: {
      // Introspection meta-fields and leaf fields add no traversal depth.
      if (/^__/.test(node.name.value) || !node.selectionSet) {
        return 0
      }
      return (
        1 +
        Math.max(
          0,
          ...node.selectionSet.selections.map((selection) =>
            determineDepth(
              selection,
              fragments,
              depthSoFar + 1,
              maxDepth,
              context,
              operationName,
              seenFragments
            )
          )
        )
      )
    }
    case Kind.FRAGMENT_SPREAD: {
      const fragmentName = node.name.value
      // Guard against fragment cycles (`graphql`'s NoFragmentCycles rule
      // reports them, but we must not recurse forever before it does).
      if (seenFragments.has(fragmentName)) return 0
      const fragment = fragments[fragmentName]
      if (!fragment) return 0
      const nextSeen = new Set(seenFragments)
      nextSeen.add(fragmentName)
      return determineDepth(
        fragment,
        fragments,
        depthSoFar,
        maxDepth,
        context,
        operationName,
        nextSeen
      )
    }
    case Kind.INLINE_FRAGMENT:
    case Kind.FRAGMENT_DEFINITION:
    case Kind.OPERATION_DEFINITION:
      return Math.max(
        0,
        ...node.selectionSet.selections.map((selection) =>
          determineDepth(
            selection,
            fragments,
            depthSoFar,
            maxDepth,
            context,
            operationName,
            seenFragments
          )
        )
      )
    default:
      return 0
  }
}

// Factory: returns an Apollo `validationRules` entry enforcing `maxDepth`.
export const depthLimit =
  (maxDepth: number = DEFAULT_MAX_QUERY_DEPTH): ValidationRule =>
  (context: ValidationContext) => {
    const { definitions } = context.getDocument()
    const fragments = getFragments(definitions)
    const operations = getOperations(definitions)

    operations.forEach((operation) => {
      const operationName = operation.name?.value ?? '<anonymous>'
      determineDepth(
        operation,
        fragments,
        0,
        maxDepth,
        context,
        operationName,
        new Set<string>()
      )
    })

    // A validation rule returns an ASTVisitor; errors are surfaced via
    // `context.reportError` above, so no visitor work is needed here.
    return {}
  }

export default depthLimit
