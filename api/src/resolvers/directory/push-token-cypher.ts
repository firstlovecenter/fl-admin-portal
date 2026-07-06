// Push notification device tokens. Each token is its own node hung off the
// owning Member:
//
//   (:Member)-[:HAS_PUSH_TOKEN]->(:PushToken { token, createdAt, lastSeenAt })
//
// Deliberately NOT declared on the Member GraphQL type — tokens are never
// selectable through the API and are managed only through the two self-scoped
// mutations in push-token-resolvers.ts, plus node-scoped pruning by the sender
// jobs. The node model (vs a list property on Member) avoids the read-modify-
// write lost-update race when the same member registers from two devices at
// once, or when a prune races a register: MERGE/DELETE lock only the individual
// token's pattern, never a shared property.

// Attach the token to the caller's Member, de-duplicated by MERGE. Idempotent:
// re-registering the same token just refreshes lastSeenAt. `createdAt` is set
// once, on first registration, to support future age-based eviction.
export const REGISTER_PUSH_TOKEN = `
  MATCH (member:Member { id: $userId })
  MERGE (member)-[:HAS_PUSH_TOKEN]->(pushToken:PushToken { token: $token })
    ON CREATE SET pushToken.createdAt = datetime()
  SET pushToken.lastSeenAt = datetime()
  RETURN pushToken.token AS token
`

// Detach and delete the caller's token node. Idempotent: unregistering an
// absent token matches nothing and is a no-op. The token is member-owned, so
// DETACH DELETE removes both the node and the HAS_PUSH_TOKEN relationship.
export const UNREGISTER_PUSH_TOKEN = `
  MATCH (member:Member { id: $userId })-[:HAS_PUSH_TOKEN]->(pushToken:PushToken { token: $token })
  DETACH DELETE pushToken
`
