import { getCheckinsDb } from './firebase'
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
} from './checkins-types'
import { Context } from '../utils/neo4j-types'

export const EVENTS_COLLECTION = 'checkinEvents'
export const CHECKINS_COLLECTION = 'checkinRecords'
export const CHECKIN_ATTEMPTS_COLLECTION = 'checkinAttempts'
export const DEVICE_CHECKINS_COLLECTION = 'checkinDevices'

const PIN_ATTEMPT_WINDOW_MS = 10 * 60 * 1000
const PIN_ATTEMPT_MAX = 5
const PIN_LOCK_MS = 15 * 60 * 1000

export const getEventDoc = async (eventId: string) => {
  const db = await getCheckinsDb()
  if (!db) return null
  return db.collection(EVENTS_COLLECTION).doc(eventId)
}

export const getCheckinsQuery = async (eventId: string) => {
  const db = await getCheckinsDb()
  if (!db) return null
  return db.collection(CHECKINS_COLLECTION).where('eventId', '==', eventId)
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
      `MATCH (member:Member {auth_id: $authId})
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
      `MATCH (member:Member {auth_id: $authId})-[:IS_ADMIN_FOR]->(church)
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
    const leadersOnly = attendanceType === 'LEADERS_ONLY'
    const query = `
      MATCH (scope:${scopeLabel} {id: $scopeId})
      ${
        depth === 0
          ? `MATCH (scope)<-[:BELONGS_TO]-(member:Member)`
          : `MATCH (scope)-[:HAS*${depth}]->(bacenta:Bacenta)
             MATCH (bacenta)<-[:BELONGS_TO]-(member:Member)`
      }
      OPTIONAL MATCH (member)-[leadRel:LEADS|IS_ADMIN_FOR]->(:Church)
      WITH member, ${depth === 0 ? 'scope' : 'bacenta'} AS unit, COUNT(leadRel) AS leaderCount
      WHERE $leadersOnly = false OR leaderCount > 0
      RETURN DISTINCT member.id AS id,
        member.firstName AS firstName,
        member.lastName AS lastName,
        unit.name AS unitName,
        labels(unit) AS unitLabels,
        CASE WHEN leaderCount > 0 THEN 'Leader/Admin' ELSE 'Member' END AS roleLabel
    `
    const res = await session.run(query, { scopeId, leadersOnly })
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

export const resolveViewerScope = async (
  context: Context,
  authId: string,
  eventScopeLevel: CheckInScopeLevel,
  eventScopeId: string,
  userRoles: string[]
): Promise<ViewerScope | null> => {
  if (
    userRoles.includes('adminDenomination') ||
    userRoles.includes('adminOversight')
  ) {
    return { id: eventScopeId, level: eventScopeLevel }
  }

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
      `MATCH (member:Member {auth_id: $authId})-[:LEADS]->(church)
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
  eventId: string
): Promise<CheckInRecord[]> => {
  const checkinsQuery = await getCheckinsQuery(eventId)
  if (!checkinsQuery) return []
  const checkinsSnapshot = await checkinsQuery.get()
  return checkinsSnapshot.docs.map((doc) => doc.data() as CheckInRecord)
}

export const getCheckInRecordForMember = async (
  eventId: string,
  memberId: string
): Promise<CheckInRecord | undefined> => {
  const checkinsQuery = await getCheckinsQuery(eventId)
  if (!checkinsQuery) return undefined
  const checkinsSnapshot = await checkinsQuery
    .where('memberId', '==', memberId)
    .limit(1)
    .get()
  return checkinsSnapshot.docs[0]?.data() as CheckInRecord | undefined
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
      MATCH (member:Member {auth_id: $authId})-[:BELONGS_TO]->(bacenta:Bacenta)
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
      `MATCH (member:Member {auth_id: $authId})-[:LEADS|IS_ADMIN_FOR]->(:Church)
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
      `MATCH (member:Member {id: $memberId})-[:LEADS|IS_ADMIN_FOR]->(:Church)
       RETURN COUNT(member) AS count`,
      { memberId }
    )
    const count = leaderRes.records[0]?.get('count')?.toNumber?.() ?? 0
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
  eventId: string,
  authId: string
): Promise<void> => {
  const db = await getCheckinsDb()
  if (!db) return
  const docRef = db
    .collection(CHECKIN_ATTEMPTS_COLLECTION)
    .doc(`${eventId}_${authId}`)
  const snapshot = await docRef.get()
  if (!snapshot.exists) return
  const data = snapshot.data()
  const lockedUntil = data?.lockedUntil
    ? new Date(data.lockedUntil).getTime()
    : 0
  if (lockedUntil && Date.now() < lockedUntil) {
    throw new Error('Too many failed PIN attempts. Please try again later.')
  }
}

export const recordFailedPinAttempt = async (
  eventId: string,
  authId: string
): Promise<void> => {
  const db = await getCheckinsDb()
  if (!db) return
  const docRef = db
    .collection(CHECKIN_ATTEMPTS_COLLECTION)
    .doc(`${eventId}_${authId}`)
  const snapshot = await docRef.get()
  const now = Date.now()
  let count = 0
  let firstAttemptAt = now
  let lockedUntil: string | null = null

  if (snapshot.exists) {
    const data = snapshot.data()!
    const existingFirst = data.firstAttemptAt
      ? new Date(data.firstAttemptAt).getTime()
      : now
    if (now - existingFirst <= PIN_ATTEMPT_WINDOW_MS) {
      count = data.count ?? 0
      firstAttemptAt = existingFirst
    }
  }

  count += 1
  if (count >= PIN_ATTEMPT_MAX) {
    lockedUntil = new Date(now + PIN_LOCK_MS).toISOString()
    count = 0
    firstAttemptAt = now
  }

  await docRef.set(
    {
      count,
      firstAttemptAt: new Date(firstAttemptAt).toISOString(),
      lockedUntil,
    },
    { merge: true }
  )
}

export const clearPinAttempts = async (
  eventId: string,
  authId: string
): Promise<void> => {
  const db = await getCheckinsDb()
  if (!db) return
  const docRef = db
    .collection(CHECKIN_ATTEMPTS_COLLECTION)
    .doc(`${eventId}_${authId}`)
  try {
    await docRef.delete()
  } catch {
    // Ignore delete failures for missing docs
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
  eventId: string,
  memberId: string,
  deviceFingerprint: string
): Promise<void> => {
  if (!deviceFingerprint) return
  const db = await getCheckinsDb()
  if (!db) return
  const docId = `${eventId}_${deviceFingerprint}`
  const docRef = db.collection(DEVICE_CHECKINS_COLLECTION).doc(docId)
  const snapshot = await docRef.get()
  if (snapshot.exists) {
    const data = snapshot.data()
    if (data?.memberId && data.memberId !== memberId) {
      throw new Error(
        'This device has already been used for check-in by another member. One device per person per event.'
      )
    }
    // Same member, same device — allow (idempotent)
    return
  }
  // Record this device ↔ member mapping
  await docRef.set({
    eventId,
    memberId,
    deviceFingerprint,
    createdAt: new Date().toISOString(),
  })
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
  eventId: string
): Promise<CheckInRecord[]> => {
  const db = await getCheckinsDb()
  if (!db) return []
  const snapshot = await db
    .collection(CHECKINS_COLLECTION)
    .where('eventId', '==', eventId)
    .where('faceMatchStatus', '==', 'FLAGGED')
    .get()
  return snapshot.docs.map((doc) => doc.data() as CheckInRecord)
}
