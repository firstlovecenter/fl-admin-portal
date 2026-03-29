import {
  getScopeLabel,
  getScopeDepth,
  generateQrToken,
  resolveAuthId,
} from './checkins-utils'
import { isPointInCircle, isPointInPolygon } from './checkins-geo-utils'
import {
  CheckInEvent,
  CheckInRecord,
  CheckInScopeLevel,
  CheckInAttendanceType,
  EligibleMember,
  ScopeFilter,
  AdminScope,
  ViewerScope,
  GeoValidationResult,
  CheckInRoleType,
  CheckInScopeAggregate,
  CheckInHistoryEntry,
  CheckInEventSummary,
} from './checkins-types'
import { Context } from '../utils/neo4j-types'
import neo4j from 'neo4j-driver'

const PIN_ATTEMPT_WINDOW_MS = 10 * 60 * 1000
const PIN_ATTEMPT_MAX = 5
const PIN_LOCK_MS = 15 * 60 * 1000

// ── Serialization helpers ──

const toJsNumber = (val: any): number => {
  if (val == null) return 0
  if (typeof val === 'number') return val
  if (typeof val?.toNumber === 'function') return val.toNumber()
  return Number(val)
}

const serializeEvent = (event: CheckInEvent): Record<string, any> => {
  const { geoCenter, geoPolygon, allowedCheckInRoles, allowedCheckInMethods, ...rest } = event
  return {
    ...rest,
    geoCenterLatitude: geoCenter?.latitude ?? null,
    geoCenterLongitude: geoCenter?.longitude ?? null,
    geoPolygon: geoPolygon ? JSON.stringify(geoPolygon) : null,
    allowedCheckInRoles: JSON.stringify(allowedCheckInRoles),
    allowedCheckInMethods: JSON.stringify(allowedCheckInMethods),
  }
}

const toIsoString = (v: any): string | null => {
  if (v == null) return null
  if (typeof v === 'string') return v
  // Neo4j DateTime objects have a toString() that returns an ISO-like string
  // e.g. "2026-03-22T14:00:00.000000000Z"
  return v.toString()
}

const deserializeEvent = (props: Record<string, any>): CheckInEvent => {
  const { geoCenterLatitude, geoCenterLongitude, geoPolygon, allowedCheckInRoles, allowedCheckInMethods, ...rest } = props
  return {
    ...rest,
    startsAt: toIsoString(rest.startsAt) as string,
    endsAt: toIsoString(rest.endsAt) as string,
    gracePeriod: toJsNumber(rest.gracePeriod),
    qrRotationSeconds: toJsNumber(rest.qrRotationSeconds),
    totalExpected: toJsNumber(rest.totalExpected),
    autoCheckoutMinutes: toJsNumber(rest.autoCheckoutMinutes),
    geoRadius: rest.geoRadius != null ? toJsNumber(rest.geoRadius) : null,
    geoCenter:
      geoCenterLatitude != null && geoCenterLongitude != null
        ? { latitude: toJsNumber(geoCenterLatitude), longitude: toJsNumber(geoCenterLongitude) }
        : null,
    geoPolygon: geoPolygon ? JSON.parse(geoPolygon) : null,
    allowedCheckInRoles: typeof allowedCheckInRoles === 'string' ? JSON.parse(allowedCheckInRoles) : allowedCheckInRoles || [],
    allowedCheckInMethods: typeof allowedCheckInMethods === 'string' ? JSON.parse(allowedCheckInMethods) : allowedCheckInMethods || ['QR'],
  } as CheckInEvent
}

const deserializeRecord = (props: Record<string, any>): CheckInRecord => ({
  ...props,
  distanceFromVenue: props.distanceFromVenue != null ? toJsNumber(props.distanceFromVenue) : null,
  faceMatchScore: props.faceMatchScore != null ? toJsNumber(props.faceMatchScore) : null,
  autoCheckedOut: props.autoCheckedOut ?? false,
} as CheckInRecord)

// ── Event CRUD ──

export const getEvent = async (
  context: Context,
  eventId: string
): Promise<CheckInEvent | null> => {
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (e:CheckInEvent {id: $eventId}) RETURN e`,
      { eventId }
    )
    if (!res.records[0]) return null
    return deserializeEvent(res.records[0].get('e').properties)
  } finally {
    await session.close()
  }
}

export const createEvent = async (
  context: Context,
  event: CheckInEvent
): Promise<void> => {
  const session = context.executionContext.session()
  try {
    const props = serializeEvent(event)
    await session.run(`CREATE (e:CheckInEvent) SET e = $props`, { props })
  } finally {
    await session.close()
  }
}

export const updateEvent = async (
  context: Context,
  eventId: string,
  updates: Record<string, any>
): Promise<void> => {
  const session = context.executionContext.session()
  try {
    await session.run(
      `MATCH (e:CheckInEvent {id: $eventId}) SET e += $updates`,
      { eventId, updates }
    )
  } finally {
    await session.close()
  }
}

export const queryEvents = async (
  context: Context,
  filters: {
    scopeLevel?: string
    status?: string
    scopeId?: string
    scopeIds?: string[]
  }
): Promise<CheckInEvent[]> => {
  const session = context.executionContext.session()
  try {
    // Auto-end any events whose endsAt has passed — handles serverless environments
    // where the background scheduler cannot run.
    const nowIso = new Date().toISOString()
    await session.run(
      `MATCH (e:CheckInEvent)
       WHERE e.status IN ['ACTIVE', 'PAUSED'] AND e.endsAt <= $nowIso
       SET e.status = 'ENDED'`,
      { nowIso }
    )

    const where: string[] = []
    const params: Record<string, any> = {}
    if (filters.scopeLevel) {
      where.push('e.scopeLevel = $scopeLevel')
      params.scopeLevel = filters.scopeLevel
    }
    if (filters.status) {
      where.push('e.status = $status')
      params.status = filters.status
    }
    if (filters.scopeId) {
      where.push('e.scopeId = $scopeId')
      params.scopeId = filters.scopeId
    }
    if (filters.scopeIds) {
      where.push('e.scopeId IN $scopeIds')
      params.scopeIds = filters.scopeIds
    }
    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
    const res = await session.run(
      `MATCH (e:CheckInEvent) ${whereClause} RETURN e`,
      params
    )
    return res.records.map((r) => deserializeEvent(r.get('e').properties))
  } finally {
    await session.close()
  }
}

// ── Record CRUD ──

export const createCheckInRecord = async (
  context: Context,
  record: Record<string, any>
): Promise<void> => {
  const session = context.executionContext.session()
  try {
    const props = Object.fromEntries(
      Object.entries(record).filter(([_, v]) => v !== undefined)
    )
    await session.run(`CREATE (r:CheckInRecord) SET r = $props`, { props })
  } finally {
    await session.close()
  }
}

export const updateCheckInRecord = async (
  context: Context,
  recordId: string,
  updates: Record<string, any>
): Promise<void> => {
  const session = context.executionContext.session()
  try {
    await session.run(
      `MATCH (r:CheckInRecord {id: $recordId}) SET r += $updates`,
      { recordId, updates }
    )
  } finally {
    await session.close()
  }
}

export const getCheckInRecordById = async (
  context: Context,
  recordId: string
): Promise<CheckInRecord | undefined> => {
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (r:CheckInRecord {id: $recordId}) RETURN r`,
      { recordId }
    )
    if (!res.records[0]) return undefined
    return deserializeRecord(res.records[0].get('r').properties)
  } finally {
    await session.close()
  }
}

export const mapEventToResponse = (event: CheckInEvent) => {
  const allowedMethods = event.allowedCheckInMethods || ['QR']
  const qrToken = allowedMethods.includes('QR')
    ? generateQrToken(event.id, event.qrSecret, event.qrRotationSeconds)
    : null
  return {
    ...event,
    qrToken,
    // Only expose PIN if PIN method is enabled
    pinCode: allowedMethods.includes('PIN') ? event.pinCode : null,
  }
}

export const getMemberByAuthId = async (
  context: Context,
  authId: string
): Promise<{ id: string; firstName: string; lastName: string } | null> => {
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (member:Member {id: $authId})
       RETURN member.id AS id, member.firstName AS firstName, member.lastName AS lastName`,
      { authId }
    )
    return res.records[0]
      ? {
          id: res.records[0].get('id'),
          firstName: res.records[0].get('firstName'),
          lastName: res.records[0].get('lastName'),
        }
      : null
  } finally {
    await session.close()
  }
}

export const getAdminScopes = async (
  context: Context,
  authId: string
): Promise<AdminScope[]> => {
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (member:Member {id: $authId})
       OPTIONAL MATCH (member)-[:IS_ADMIN_FOR]->(adminChurch)
       OPTIONAL MATCH (member)-[:LEADS]->(leadChurch)
       WITH collect(DISTINCT adminChurch) + collect(DISTINCT leadChurch) AS churches
       UNWIND churches AS church
       WITH DISTINCT church
       WHERE church IS NOT NULL
       RETURN church.id AS id, church.name AS name, labels(church) AS labels`,
      { authId }
    )
    return res.records.map((record) => ({
      id: record.get('id'),
      name: record.get('name'),
      labels: record.get('labels'),
    }))
  } finally {
    await session.close()
  }
}

/**
 * Expands a single scopeId to include all ancestor scope IDs in the church
 * hierarchy (via the :HAS relationship). This allows a Bacenta leader to see
 * events scoped at their parent Campus, Stream, etc.
 */
export const expandScopeToAncestors = async (
  context: Context,
  scopeId: string
): Promise<string[]> => {
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (church {id: $scopeId})
       OPTIONAL MATCH (ancestor)-[:HAS*1..6]->(church)
       WITH church.id AS churchId, collect(DISTINCT ancestor.id) AS ancestorIds
       RETURN [churchId] + ancestorIds AS ids`,
      { scopeId }
    )
    return (res.records[0]?.get('ids') as string[]) ?? [scopeId]
  } finally {
    await session.close()
  }
}

/**
 * Returns the set of scopeIds the caller can see, combining both admin and
 * leader relationships in a single Neo4j round-trip. Includes ancestor scope
 * IDs so a Bacenta leader can see events created at their Campus, Stream, etc.
 *
 * Returns null for denomination/oversight admins (no filter needed — they see
 * everything). Returns an empty array if the viewer has no scopes at all.
 */
export const getViewerScopeIds = async (
  context: Context,
  authId: string,
  userRoles: string[]
): Promise<string[] | null> => {
  if (
    userRoles.includes('adminDenomination') ||
    userRoles.includes('adminOversight')
  ) {
    return null
  }

  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (m:Member {id: $authId})
       OPTIONAL MATCH (m)-[:IS_ADMIN_FOR]->(adminChurch)
       OPTIONAL MATCH (m)-[:LEADS]->(leadChurch)
       WITH collect(DISTINCT adminChurch) + collect(DISTINCT leadChurch) AS churches
       UNWIND churches AS church
       WITH DISTINCT church WHERE church IS NOT NULL
       OPTIONAL MATCH (ancestor)-[:HAS*1..6]->(church)
       WITH collect(DISTINCT church.id) + collect(DISTINCT ancestor.id) AS ids
       RETURN [id IN ids WHERE id IS NOT NULL] AS ids`,
      { authId }
    )
    return (res.records[0]?.get('ids') as string[]) ?? []
  } finally {
    await session.close()
  }
}

export const resolveScopeLevelFromLabels = (
  labels: string[]
): CheckInScopeLevel => {
  if (labels.includes('Oversight')) return 'OVERSIGHT'
  if (labels.includes('Campus')) return 'CAMPUS'
  if (labels.includes('Stream')) return 'STREAM'
  if (labels.includes('Council')) return 'COUNCIL'
  if (labels.includes('Governorship')) return 'GOVERNORSHIP'
  return 'BACENTA'
}

export const assertAdminForScope = async (
  context: Context,
  authId: string,
  eventScopeLevel: CheckInScopeLevel,
  eventScopeId: string,
  userRoles: string[]
): Promise<void> => {
  if (userRoles.includes('adminDenomination')) return

  const adminScopes = await getAdminScopes(context, authId)
  if (!adminScopes.length) {
    throw new Error('You are not an admin for this scope')
  }

  const session = context.executionContext.session()
  try {
    const scopeLabel = getScopeLabel(eventScopeLevel)
    for (const adminScope of adminScopes) {
      const adminLevel = resolveScopeLevelFromLabels(adminScope.labels)
      const adminLabel = getScopeLabel(adminLevel)
      const res = await session.run(
        `MATCH (eventScope:${scopeLabel} {id: $eventScopeId})
         MATCH (adminScope:${adminLabel} {id: $adminScopeId})
         WHERE adminScope.id = eventScope.id
           OR EXISTS((adminScope)-[:HAS*1..6]->(eventScope))
         RETURN adminScope.id AS id`,
        { eventScopeId, adminScopeId: adminScope.id }
      )
      if (res.records.length > 0) return
    }
  } finally {
    await session.close()
  }
  throw new Error('You are not an admin for this scope')
}

export const getEligibleMembers = async (
  context: Context,
  scopeLevel: CheckInScopeLevel,
  scopeId: string,
  attendanceType: CheckInAttendanceType
): Promise<EligibleMember[]> => {
  const session = context.executionContext.session()
  try {
    const scopeLabel = getScopeLabel(scopeLevel)
    const depth = getScopeDepth(scopeLevel)

    let query: string
    if (attendanceType === 'LEADERS_ONLY') {
      // Find members who LEAD a church that IS the scope or is a descendant of it.
      // Excludes closed churches. Deduplicates members by picking their lowest-level
      // (most specific) primary church within the scope.
      if (depth === 0) {
        // Bacenta scope: only the bacenta leader(s)
        query = `
          MATCH (scope:${scopeLabel} {id: $scopeId})
          MATCH (member:Member)-[:LEADS|IS_ADMIN_FOR]->(scope)
          RETURN DISTINCT member.id AS id,
            member.firstName AS firstName,
            member.lastName AS lastName,
            scope.name AS unitName,
            labels(scope) AS unitLabels,
            'Leader/Admin' AS roleLabel
        `
      } else {
        // Higher scope: include the scope itself and all active descendant churches.
        // Closed churches (labels starting with "Closed") are excluded so their
        // former leaders are not expected to check in.
        query = `
          MATCH (scope:${scopeLabel} {id: $scopeId})
          OPTIONAL MATCH (scope)-[:HAS*1..${depth}]->(descendant)
          WITH scope,
            [d IN collect(DISTINCT descendant)
             WHERE NOT ANY(l IN labels(d) WHERE l STARTS WITH 'Closed')] AS activeDescendants
          UNWIND [scope] + activeDescendants AS church
          MATCH (member:Member)-[:LEADS|IS_ADMIN_FOR]->(church)
          WITH DISTINCT member.id AS memberId,
            member.firstName AS firstName,
            member.lastName AS lastName,
            church,
            CASE
              WHEN church:Bacenta    THEN 0
              WHEN church:Governorship OR church:Constituency THEN 1
              WHEN church:Council    THEN 2
              WHEN church:Stream     THEN 3
              WHEN church:Campus     THEN 4
              ELSE 5
            END AS churchDepth
          ORDER BY memberId, churchDepth ASC
          WITH memberId, firstName, lastName, COLLECT(church)[0] AS primaryChurch
          RETURN memberId AS id,
            firstName,
            lastName,
            primaryChurch.name AS unitName,
            labels(primaryChurch) AS unitLabels,
            'Leader/Admin' AS roleLabel
        `
      }
    } else {
      // ALL_MEMBERS: everyone who belongs to a Bacenta under this scope
      const memberMatch =
        depth === 0
          ? `MATCH (scope)<-[:BELONGS_TO]-(member:Member)`
          : `MATCH (scope)-[:HAS*${depth}]->(bacenta:Bacenta)\n             MATCH (bacenta)<-[:BELONGS_TO]-(member:Member)`
      const unitAlias = depth === 0 ? 'scope' : 'bacenta'
      query = `
        MATCH (scope:${scopeLabel} {id: $scopeId})
        ${memberMatch}
        OPTIONAL MATCH (member)-[leadRel:LEADS|IS_ADMIN_FOR]->()
        WITH member, ${unitAlias} AS unit, COUNT(leadRel) AS leaderCount
        RETURN DISTINCT member.id AS id,
          member.firstName AS firstName,
          member.lastName AS lastName,
          unit.name AS unitName,
          labels(unit) AS unitLabels,
          CASE WHEN leaderCount > 0 THEN 'Leader/Admin' ELSE 'Member' END AS roleLabel
      `
    }

    const res = await session.run(query, { scopeId })
    return res.records.map((record) => ({
      memberId: record.get('id'),
      firstName: record.get('firstName'),
      lastName: record.get('lastName'),
      fullName: `${record.get('firstName')} ${record.get('lastName')}`,
      unitName: record.get('unitName'),
      unitLabels: record.get('unitLabels'),
      roleLabel: record.get('roleLabel'),
    }))
  } finally {
    await session.close()
  }
}

export const getScopeFilters = async (
  context: Context,
  scopeLevel: CheckInScopeLevel,
  scopeId: string
): Promise<ScopeFilter[]> => {
  const session = context.executionContext.session()
  try {
    const scopeLabel = getScopeLabel(scopeLevel)
    const depth = getScopeDepth(scopeLevel)
    const query = `
      MATCH (scope:${scopeLabel} {id: $scopeId})
      WITH scope
      OPTIONAL MATCH (scope)-[:HAS*1..${depth}]->(child)
      WHERE child:Campus OR child:Stream OR child:Council OR child:Governorship OR child:Bacenta
      RETURN scope.id AS scopeId,
        scope.name AS scopeName,
        labels(scope) AS scopeLabels,
        child.id AS id,
        child.name AS name,
        labels(child) AS labels
    `
    const res = await session.run(query, { scopeId })
    const items = res.records
      .map((record) => ({
        id: record.get('id'),
        name: record.get('name'),
        labels: record.get('labels'),
        scopeId: record.get('scopeId'),
        scopeName: record.get('scopeName'),
        scopeLabels: record.get('scopeLabels'),
      }))
      .filter((item) => item.id)

    const eventScope = res.records[0]
      ? {
          id: res.records[0].get('scopeId'),
          name: res.records[0].get('scopeName'),
          labels: res.records[0].get('scopeLabels'),
        }
      : { id: scopeId, name: scopeLabel, labels: [scopeLabel] }

    const normalized = [eventScope, ...items].map((item) => ({
      id: item.id,
      name: item.name,
      level: resolveScopeLevelFromLabels(item.labels),
    }))

    const uniqueMap = new Map<string, ScopeFilter>()
    normalized.forEach((item) => {
      if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item)
    })
    return Array.from(uniqueMap.values())
  } finally {
    await session.close()
  }
}

export const getDirectChildren = async (
  context: Context,
  parentScopeId: string
): Promise<ScopeFilter[]> => {
  const session = context.executionContext.session()
  try {
    const query = `
      MATCH ({id: $parentScopeId})-[:HAS]->(child)
      WHERE child:Campus OR child:Stream OR child:Council OR child:Governorship OR child:Bacenta
      RETURN child.id AS id, child.name AS name, labels(child) AS labels
    `
    const res = await session.run(query, { parentScopeId })
    return res.records.map((record) => ({
      id: record.get('id'),
      name: record.get('name'),
      level: resolveScopeLevelFromLabels(record.get('labels')),
    }))
  } finally {
    await session.close()
  }
}

export const resolveViewerScope = async (
  context: Context,
  authId: string,
  eventScopeLevel: CheckInScopeLevel,
  eventScopeId: string,
  userRoles: string[]
): Promise<ViewerScope | null> => {
  // Global admins can see everything
  if (
    userRoles.includes('adminDenomination') ||
    userRoles.includes('adminOversight')
  ) {
    return { id: eventScopeId, level: eventScopeLevel }
  }

  // Check if the user has a matching admin role for this scope level or above
  const roleScopeMap: Record<string, CheckInScopeLevel> = {
    adminCampus: 'CAMPUS',
    adminStream: 'STREAM',
    adminCouncil: 'COUNCIL',
    adminGovernorship: 'GOVERNORSHIP',
  }

  const eventDepth = getScopeDepth(eventScopeLevel)

  for (const role of userRoles) {
    const roleLevel = roleScopeMap[role]
    if (roleLevel && getScopeDepth(roleLevel) >= eventDepth) {
      // User has an admin role at or above the event scope level
      // Verify they actually admin a church that contains the event scope
      const session = context.executionContext.session()
      try {
        const roleLabel = getScopeLabel(roleLevel)
        const scopeLabel = getScopeLabel(eventScopeLevel)
        const res = await session.run(
          `MATCH (member:Member {id: $authId})-[:IS_ADMIN_FOR]->(adminChurch:${roleLabel})
           MATCH (eventScope:${scopeLabel} {id: $eventScopeId})
           WHERE adminChurch.id = eventScope.id
             OR EXISTS((adminChurch)-[:HAS*1..6]->(eventScope))
           RETURN adminChurch.id AS id`,
          { authId, eventScopeId }
        )
        if (res.records.length > 0) {
          return {
            id: res.records[0].get('id'),
            level: roleLevel,
          }
        }
      } finally {
        await session.close()
      }
    }
  }

  // Fallback: check all admin and leader scopes from graph relationships
  const adminScopes = await getAdminScopes(context, authId)
  const session = context.executionContext.session()
  try {
    const scopeLabel = getScopeLabel(eventScopeLevel)
    const scopedAdminNodes: ViewerScope[] = []

    for (const adminScope of adminScopes) {
      const adminLevel = resolveScopeLevelFromLabels(adminScope.labels)
      const adminLabel = getScopeLabel(adminLevel)
      const query = `
        MATCH (eventScope:${scopeLabel} {id: $eventScopeId})
        MATCH (adminScope:${adminLabel} {id: $adminScopeId})
        WHERE adminScope.id = eventScope.id
          OR EXISTS((adminScope)-[:HAS*1..6]->(eventScope))
        RETURN adminScope.id AS id
      `
      const res = await session.run(query, {
        eventScopeId,
        adminScopeId: adminScope.id,
      })
      if (res.records.length > 0) {
        scopedAdminNodes.push({ id: adminScope.id, level: adminLevel })
      }
    }

    // Also check if the user is a leader within the event scope
    const leaderRes = await session.run(
      `MATCH (member:Member {id: $authId})-[:LEADS]->(church)
       RETURN church.id AS id, labels(church) AS labels`,
      { authId }
    )

    for (const record of leaderRes.records) {
      const leadId = record.get('id')
      const leadLabels = record.get('labels')
      const leadLevel = resolveScopeLevelFromLabels(leadLabels)
      const leadLabel = getScopeLabel(leadLevel)
      const containsCheck = await session.run(
        `MATCH (eventScope:${scopeLabel} {id: $eventScopeId})
         MATCH (leaderScope:${leadLabel} {id: $leadScopeId})
         WHERE leaderScope.id = eventScope.id
           OR EXISTS((leaderScope)-[:HAS*1..6]->(eventScope))
           OR EXISTS((eventScope)-[:HAS*1..6]->(leaderScope))
         RETURN leaderScope.id AS id`,
        { eventScopeId, leadScopeId: leadId }
      )
      if (containsCheck.records.length > 0) {
        scopedAdminNodes.push({ id: leadId, level: leadLevel })
      }
    }

    if (!scopedAdminNodes.length) return null

    scopedAdminNodes.sort(
      (a, b) => getScopeDepth(b.level) - getScopeDepth(a.level)
    )
    return scopedAdminNodes[0]
  } finally {
    await session.close()
  }
}

export const getCheckInRecords = async (
  context: Context,
  eventId: string
): Promise<CheckInRecord[]> => {
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (r:CheckInRecord {eventId: $eventId}) RETURN r`,
      { eventId }
    )
    return res.records.map((r) => deserializeRecord(r.get('r').properties))
  } finally {
    await session.close()
  }
}

export const getCheckInRecordForMember = async (
  context: Context,
  eventId: string,
  memberId: string
): Promise<CheckInRecord | undefined> => {
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (r:CheckInRecord {eventId: $eventId, memberId: $memberId}) RETURN r LIMIT 1`,
      { eventId, memberId }
    )
    if (!res.records[0]) return undefined
    return deserializeRecord(res.records[0].get('r').properties)
  } finally {
    await session.close()
  }
}

export const isMemberInScope = async (
  context: Context,
  scopeLevel: CheckInScopeLevel,
  scopeId: string,
  authId: string
): Promise<boolean> => {
  const session = context.executionContext.session()
  try {
    const scopeLabel = getScopeLabel(scopeLevel)
    const depth = getScopeDepth(scopeLevel)
    const query = `
      MATCH (member:Member {id: $authId})-[:BELONGS_TO]->(bacenta:Bacenta)
      MATCH (scope:${scopeLabel} {id: $scopeId})
      ${
        depth === 0
          ? `WHERE scope.id = bacenta.id`
          : `MATCH (scope)-[:HAS*${depth}]->(bacenta)`
      }
      RETURN COUNT(bacenta) AS count
    `
    const res = await session.run(query, { authId, scopeId })
    const count = res.records[0]?.get('count')?.toNumber?.() ?? 0
    return count > 0
  } finally {
    await session.close()
  }
}

export const isMemberIdInScope = async (
  context: Context,
  scopeLevel: CheckInScopeLevel,
  scopeId: string,
  memberId: string
): Promise<boolean> => {
  const session = context.executionContext.session()
  try {
    const scopeLabel = getScopeLabel(scopeLevel)
    const depth = getScopeDepth(scopeLevel)
    const query = `
      MATCH (member:Member {id: $memberId})-[:BELONGS_TO]->(bacenta:Bacenta)
      MATCH (scope:${scopeLabel} {id: $scopeId})
      ${
        depth === 0
          ? `WHERE scope.id = bacenta.id`
          : `MATCH (scope)-[:HAS*${depth}]->(bacenta)`
      }
      RETURN COUNT(bacenta) AS count
    `
    const res = await session.run(query, { memberId, scopeId })
    const count = res.records[0]?.get('count')?.toNumber?.() ?? 0
    return count > 0
  } finally {
    await session.close()
  }
}

export const isLeaderOrAdmin = async (
  context: Context,
  authId: string
): Promise<boolean> => {
  const session = context.executionContext.session()
  try {
    const leaderRes = await session.run(
      `MATCH (member:Member {id: $authId})-[:LEADS|IS_ADMIN_FOR]->(:Church)
       RETURN COUNT(member) AS count`,
      { authId }
    )
    const count = leaderRes.records[0]?.get('count')?.toNumber?.() ?? 0
    return count > 0
  } finally {
    await session.close()
  }
}

export const isMemberLeaderOrAdminById = async (
  context: Context,
  memberId: string
): Promise<boolean> => {
  const session = context.executionContext.session()
  try {
    const leaderRes = await session.run(
      `MATCH (member:Member {id: $memberId})-[:LEADS|IS_ADMIN_FOR]->()
       RETURN COUNT(member) AS count`,
      { memberId }
    )
    const count = leaderRes.records[0]?.get('count')?.toNumber?.() ?? 0
    return count > 0
  } finally {
    await session.close()
  }
}

/**
 * Returns true if the member leads or admins any active church that IS the
 * event scope or is a descendant of it. Mirrors the LEADERS_ONLY eligibility
 * logic in getEligibleMembers.
 */
export const isMemberLeaderInScope = async (
  context: Context,
  scopeLevel: CheckInScopeLevel,
  scopeId: string,
  memberId: string
): Promise<boolean> => {
  const session = context.executionContext.session()
  try {
    const scopeLabel = getScopeLabel(scopeLevel)
    const depth = getScopeDepth(scopeLevel)
    const res = await session.run(
      `MATCH (scope:${scopeLabel} {id: $scopeId})
       OPTIONAL MATCH (scope)-[:HAS*1..${depth}]->(descendant)
       WITH scope,
         [d IN collect(DISTINCT descendant)
          WHERE NOT ANY(l IN labels(d) WHERE l STARTS WITH 'Closed')] AS activeDescendants
       UNWIND [scope] + activeDescendants AS church
       MATCH (member:Member {id: $memberId})-[:LEADS|IS_ADMIN_FOR]->(church)
       RETURN COUNT(DISTINCT church) AS count`,
      { scopeId, memberId }
    )
    const count = res.records[0]?.get('count')?.toNumber?.() ?? 0
    return count > 0
  } finally {
    await session.close()
  }
}

export const getMemberUnitName = async (
  context: Context,
  memberId: string
): Promise<string> => {
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (member:Member {id: $memberId})-[:BELONGS_TO]->(bacenta:Bacenta)
       RETURN bacenta.name AS name`,
      { memberId }
    )
    return res.records[0]?.get('name') ?? ''
  } finally {
    await session.close()
  }
}

export const enforcePinAttemptPolicy = async (
  context: Context,
  eventId: string,
  authId: string
): Promise<void> => {
  const session = context.executionContext.session()
  try {
    const docId = `${eventId}_${authId}`
    const res = await session.run(
      `MATCH (a:CheckInAttempt {id: $docId}) RETURN a.lockedUntil AS lockedUntil`,
      { docId }
    )
    if (!res.records[0]) return
    const lockedUntil = res.records[0].get('lockedUntil')
    if (lockedUntil && Date.now() < new Date(lockedUntil).getTime()) {
      throw new Error('Too many failed PIN attempts. Please try again later.')
    }
  } finally {
    await session.close()
  }
}

export const recordFailedPinAttempt = async (
  context: Context,
  eventId: string,
  authId: string
): Promise<void> => {
  const session = context.executionContext.session()
  try {
    const docId = `${eventId}_${authId}`
    const now = Date.now()
    const res = await session.run(
      `MERGE (a:CheckInAttempt {id: $docId})
       ON CREATE SET a.count = 0, a.firstAttemptAt = $nowIso, a.lockedUntil = null
       RETURN a.count AS count, a.firstAttemptAt AS firstAttemptAt`,
      { docId, nowIso: new Date(now).toISOString() }
    )
    let count = res.records[0]?.get('count')
    count = typeof count?.toNumber === 'function' ? count.toNumber() : (count ?? 0)
    const firstAttemptAt = res.records[0]?.get('firstAttemptAt')
    let firstTime = firstAttemptAt ? new Date(firstAttemptAt).getTime() : now

    if (now - firstTime > PIN_ATTEMPT_WINDOW_MS) {
      count = 0
      firstTime = now
    }
    count += 1
    let lockedUntil: string | null = null
    if (count >= PIN_ATTEMPT_MAX) {
      lockedUntil = new Date(now + PIN_LOCK_MS).toISOString()
      count = 0
      firstTime = now
    }
    await session.run(
      `MATCH (a:CheckInAttempt {id: $docId})
       SET a.count = $count, a.firstAttemptAt = $firstAttemptAt, a.lockedUntil = $lockedUntil`,
      { docId, count, firstAttemptAt: new Date(firstTime).toISOString(), lockedUntil }
    )
  } finally {
    await session.close()
  }
}

export const clearPinAttempts = async (
  context: Context,
  eventId: string,
  authId: string
): Promise<void> => {
  const session = context.executionContext.session()
  try {
    await session.run(
      `MATCH (a:CheckInAttempt {id: $id}) DELETE a`,
      { id: `${eventId}_${authId}` }
    )
  } catch {
    // Ignore delete failures for missing nodes
  }
}

export const getCurrentAuthId = (context: Context): string =>
  resolveAuthId(context)

export const isUserAllowedToCheckIn = (
  userRoles: string[],
  allowedCheckInRoles: CheckInRoleType[]
): boolean => {
  return userRoles.some((role) =>
    allowedCheckInRoles.includes(role as CheckInRoleType)
  )
}

/**
 * One-device-per-event rule.
 * If another member has already checked in on the same device for this event, block.
 */
export const enforceOneDevicePerEvent = async (
  context: Context,
  eventId: string,
  memberId: string,
  deviceFingerprint: string
): Promise<void> => {
  if (!deviceFingerprint) return
  const session = context.executionContext.session()
  try {
    const docId = `${eventId}_${deviceFingerprint}`
    const res = await session.run(
      `MERGE (d:CheckInDevice {id: $docId})
       ON CREATE SET d.eventId = $eventId, d.memberId = $memberId,
                     d.deviceFingerprint = $deviceFingerprint, d.createdAt = $now
       RETURN d.memberId AS existingMemberId`,
      { docId, eventId, memberId, deviceFingerprint, now: new Date().toISOString() }
    )
    const existingMemberId = res.records[0]?.get('existingMemberId')
    if (existingMemberId && existingMemberId !== memberId) {
      throw new Error(
        'This device has already been used for check-in by another member. One device per person per event.'
      )
    }
  } finally {
    await session.close()
  }
}

/**
 * Validate geo-fence (circle or polygon) for an event.
 * Geofence is always required — users must be within the fence to check in.
 * Returns { verified: boolean, distance: number | null }.
 */
export const validateGeoFence = (
  event: CheckInEvent,
  latitude?: number | null,
  longitude?: number | null
): GeoValidationResult => {
  if (latitude == null || longitude == null) {
    throw new Error('Location is required for check-in. Please enable GPS.')
  }
  if (event.geoFenceType === 'CIRCLE') {
    if (!event.geoCenter || !event.geoRadius) {
      // Misconfigured — skip enforcement
      return { verified: true, distance: null }
    }
    const result = isPointInCircle(
      latitude,
      longitude,
      event.geoCenter,
      event.geoRadius
    )
    return { verified: result.inside, distance: Math.round(result.distance) }
  }
  if (event.geoFenceType === 'POLYGON') {
    if (!event.geoPolygon || event.geoPolygon.length < 3) {
      return { verified: true, distance: null }
    }
    const inside = isPointInPolygon(latitude, longitude, event.geoPolygon)
    // For polygon, distance to nearest edge is complex — store null
    return { verified: inside, distance: null }
  }
  return { verified: true, distance: null }
}

/**
 * Get flagged check-in records for an event (faceMatchStatus === 'FLAGGED').
 */
export const getFlaggedCheckIns = async (
  context: Context,
  eventId: string
): Promise<CheckInRecord[]> => {
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (r:CheckInRecord {eventId: $eventId, faceMatchStatus: 'FLAGGED'}) RETURN r`,
      { eventId }
    )
    return res.records.map((r) => deserializeRecord(r.get('r').properties))
  } finally {
    await session.close()
  }
}

// ── Aggregate Queries ──

/**
 * Get check-in aggregate stats per sub-church for breakdown pages.
 * For a given scope (e.g., Campus), returns stats for each direct child (e.g., Streams).
 */
export const getCheckInAggregateByScope = async (
  context: Context,
  scopeLevel: CheckInScopeLevel,
  scopeId: string
): Promise<CheckInScopeAggregate[]> => {
  const session = context.executionContext.session()
  try {
    const scopeLabel = getScopeLabel(scopeLevel)
    // Get direct children of this scope
    const childRes = await session.run(
      `MATCH (scope:${scopeLabel} {id: $scopeId})-[:HAS]->(child)
       RETURN child.id AS id, child.name AS name, labels(child) AS labels`,
      { scopeId }
    )
    if (childRes.records.length === 0) return []

    const aggregates: CheckInScopeAggregate[] = []

    for (const record of childRes.records) {
      const childId = record.get('id')
      const childName = record.get('name')
      const childLabels = record.get('labels') as string[]
      const childLevel = resolveScopeLevelFromLabels(childLabels)

      // Count events scoped at or below this child
      const childLabel = getScopeLabel(childLevel)
      const childDepth = getScopeDepth(childLevel)
      const eventsRes = await session.run(
        `MATCH (child:${childLabel} {id: $childId})
         OPTIONAL MATCH (child)-[:HAS*0..${childDepth}]->(descendant)
         WITH collect(DISTINCT child.id) + collect(DISTINCT descendant.id) AS scopeIds
         MATCH (e:CheckInEvent) WHERE e.scopeId IN scopeIds
         RETURN count(e) AS totalEvents, sum(e.totalExpected) AS totalExpected`,
        { childId }
      )
      const totalEvents = eventsRes.records[0]?.get('totalEvents')?.toNumber?.() ?? 0
      const totalExpected = eventsRes.records[0]?.get('totalExpected')?.toNumber?.() ?? 0

      // Count check-in records for events under this child
      const recordsRes = await session.run(
        `MATCH (child:${childLabel} {id: $childId})
         OPTIONAL MATCH (child)-[:HAS*0..${childDepth}]->(descendant)
         WITH collect(DISTINCT child.id) + collect(DISTINCT descendant.id) AS scopeIds
         MATCH (e:CheckInEvent) WHERE e.scopeId IN scopeIds
         OPTIONAL MATCH (r:CheckInRecord {eventId: e.id})
         RETURN count(r) AS checkedInCount`,
        { childId }
      )
      const checkedInCount = recordsRes.records[0]?.get('checkedInCount')?.toNumber?.() ?? 0
      const defaultedCount = Math.max(0, totalExpected - checkedInCount)
      const attendancePercentage = totalExpected > 0
        ? Number(((checkedInCount / totalExpected) * 100).toFixed(1))
        : 0

      aggregates.push({
        scopeId: childId,
        scopeName: childName,
        scopeLevel: childLevel,
        totalEvents,
        totalExpected,
        checkedInCount,
        defaultedCount,
        attendancePercentage,
      })
    }

    return aggregates
  } finally {
    await session.close()
  }
}

// ── Audit History ──

/**
 * Create a history entry for a check-in event.
 */
export const createCheckInHistoryEntry = async (
  context: Context,
  entry: CheckInHistoryEntry
): Promise<void> => {
  const session = context.executionContext.session()
  try {
    await session.run(
      `MATCH (e:CheckInEvent {id: $eventId})
       CREATE (h:CheckInHistory {
         id: $id,
         timestamp: $timestamp,
         action: $action,
         description: $description,
         performedById: $performedById,
         performedByName: $performedByName,
         eventId: $eventId
       })
       CREATE (e)-[:HAS_HISTORY]->(h)`,
      {
        eventId: entry.id.split('_')[0] || entry.id, // placeholder — actual eventId passed separately
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.action,
        description: entry.description,
        performedById: entry.performedById,
        performedByName: entry.performedByName,
      }
    )
  } finally {
    await session.close()
  }
}

/**
 * Log a check-in history entry (creates node and links to event).
 */
export const logCheckInHistory = async (
  context: Context,
  eventId: string,
  action: string,
  description: string,
  performedById: string,
  performedByName: string
): Promise<CheckInHistoryEntry> => {
  const session = context.executionContext.session()
  const id = `${eventId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const timestamp = new Date().toISOString()
  try {
    await session.run(
      `MATCH (e:CheckInEvent {id: $eventId})
       CREATE (h:CheckInHistory {
         id: $id,
         timestamp: $timestamp,
         action: $action,
         description: $description,
         performedById: $performedById,
         performedByName: $performedByName,
         eventId: $eventId
       })
       CREATE (e)-[:HAS_HISTORY]->(h)`,
      { eventId, id, timestamp, action, description, performedById, performedByName }
    )
    return { id, timestamp, action, description, performedById, performedByName }
  } finally {
    await session.close()
  }
}

/**
 * Get audit history entries for a check-in event, ordered newest first.
 */
export const getCheckInEventHistory = async (
  context: Context,
  eventId: string,
  limit: number = 50
): Promise<CheckInHistoryEntry[]> => {
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `MATCH (e:CheckInEvent {id: $eventId})-[:HAS_HISTORY]->(h:CheckInHistory)
       RETURN h
       ORDER BY h.timestamp DESC
       LIMIT $limit`,
      { eventId, limit: neo4j.int(Math.trunc(typeof limit === 'number' ? limit : 50)) }
    )
    return res.records.map((r) => {
      const props = r.get('h').properties
      return {
        id: props.id,
        timestamp: props.timestamp,
        action: props.action,
        description: props.description,
        performedById: props.performedById,
        performedByName: props.performedByName,
      }
    })
  } finally {
    await session.close()
  }
}

/**
 * Batch-fetch lightweight attendance stats for multiple events.
 * Uses stored totalExpected (no eligible-member recalculation) — fast for report pages.
 */
export const getCheckInEventStatsBatch = async (
  context: Context,
  eventIds: string[]
): Promise<CheckInEventSummary[]> => {
  if (!eventIds.length) return []
  const session = context.executionContext.session()
  try {
    const res = await session.run(
      `UNWIND $eventIds AS eid
       MATCH (e:CheckInEvent {id: eid})
       OPTIONAL MATCH (r:CheckInRecord {eventId: eid})
       RETURN e.id AS eventId,
         e.totalExpected AS totalExpected,
         COUNT(r) AS totalRecords,
         SUM(CASE WHEN r IS NOT NULL AND r.checkedOutAt IS NOT NULL THEN 1 ELSE 0 END) AS checkedOutCount`,
      { eventIds }
    )
    return res.records.map((rec) => {
      const totalExpected = rec.get('totalExpected')?.toNumber?.() ?? 0
      const totalRecords = rec.get('totalRecords')?.toNumber?.() ?? 0
      const checkedOutCount = rec.get('checkedOutCount')?.toNumber?.() ?? 0
      const checkedInCount = Math.max(0, totalRecords - checkedOutCount)
      const defaultedCount = Math.max(0, totalExpected - totalRecords)
      const percentage =
        totalExpected > 0
          ? Number(((checkedInCount / totalExpected) * 100).toFixed(1))
          : 0
      return {
        eventId: rec.get('eventId'),
        totalExpected,
        checkedInCount,
        checkedOutCount,
        defaultedCount,
        percentage,
      }
    })
  } finally {
    await session.close()
  }
}
