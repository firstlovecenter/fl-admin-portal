import { v4 as uuidv4 } from 'uuid'
import { isAuth } from '../utils/utils'
import { permitAdmin } from '../permissions'
import { getCheckinsDb } from './firebase'
import {
  getScopeLabel,
  generatePinCode,
  generateQrSecret,
  isWithinEventWindow,
  validateQrToken,
} from './checkins-utils'
import {
  getEventDoc,
  mapEventToResponse,
  getMemberByAuthId,
  getAdminScopes,
  resolveScopeLevelFromLabels,
  assertAdminForScope,
  getEligibleMembers,
  getScopeFilters,
  resolveViewerScope,
  getViewerScopeIds,
  getCheckInRecords,
  getCheckInRecordForMember,
  isMemberInScope,
  isMemberIdInScope,
  isLeaderOrAdmin,
  isMemberLeaderOrAdminById,
  getMemberUnitName,
  enforcePinAttemptPolicy,
  recordFailedPinAttempt,
  clearPinAttempts,
  getCurrentAuthId,
  isUserAllowedToCheckIn,
  enforceOneDevicePerEvent,
  validateGeoFence,
  getFlaggedCheckIns,
  EVENTS_COLLECTION,
  CHECKINS_COLLECTION,
} from './checkins-service'
import { CheckInEvent, CheckInMethod, FaceMatchStatus } from './checkins-types'
import { Context } from '../utils/neo4j-types'

export const checkinsResolvers = {
  Query: {
    GetEventsInRange: async (
      object: unknown,
      args: { latitude: number; longitude: number },
      context: Context
    ) => {
      const db = await getCheckinsDb()
      if (!db) return []

      const snapshot = await db
        .collection(EVENTS_COLLECTION)
        .where('status', '==', 'ACTIVE')
        .get()

      if (snapshot.empty) return []

      const now = new Date()
      const results: ReturnType<typeof mapEventToResponse>[] = []

      for (const doc of snapshot.docs) {
        const event = doc.data() as CheckInEvent

        // Skip events outside their time window
        if (new Date(event.startsAt) > now || new Date(event.endsAt) < now) {
          continue
        }

        // Only include events whose geofence contains the caller's position
        const geoResult = validateGeoFence(event, args.latitude, args.longitude)
        if (geoResult.verified) {
          results.push(mapEventToResponse(event))
        }
      }

      return results
    },

    GetCheckInEvent: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      // Authorization check - user must be within the event scope
      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      const authId = getCurrentAuthId(context)
      const viewerScope = await resolveViewerScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )
      if (!viewerScope) throw new Error('You do not have access to this event')

      return mapEventToResponse(event)
    },

    ListCheckInEvents: async (
      object: unknown,
      args: {
        scopeLevel?: string
        scopeId?: string
        status?: string
      },
      context: Context
    ) => {
      const db = await getCheckinsDb()
      if (!db) return []

      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      const authId = getCurrentAuthId(context)

      let query: FirebaseFirestore.Query = db.collection(EVENTS_COLLECTION)
      if (args.scopeLevel) query = query.where('scopeLevel', '==', args.scopeLevel)
      if (args.status) query = query.where('status', '==', args.status)

      if (args.scopeId) {
        // Caller requested a specific scope — filter directly, then do a
        // single access check rather than one check per event.
        query = query.where('scopeId', '==', args.scopeId)
        const snapshot = await query.get()
        if (snapshot.empty) return []

        const events = snapshot.docs.map((doc) => doc.data() as CheckInEvent)
        const firstEvent = events[0]
        const viewerScope = await resolveViewerScope(
          context,
          authId,
          firstEvent.scopeLevel,
          firstEvent.scopeId,
          userRoles
        )
        return viewerScope ? events.map(mapEventToResponse) : []
      }

      // No specific scope requested — pre-filter Firestore to only the scopes
      // the viewer can see. This avoids a Neo4j round-trip per event.
      const viewerScopeIds = await getViewerScopeIds(context, authId, userRoles)

      if (viewerScopeIds !== null) {
        // Non-global viewer: restrict to their own scope IDs
        if (viewerScopeIds.length === 0) return []
        // Firestore 'in' supports up to 30 items; leaders/local-admins have far fewer
        query = query.where('scopeId', 'in', viewerScopeIds.slice(0, 30))
      }
      // viewerScopeIds === null → denomination/oversight admin, no extra filter

      const snapshot = await query.get()
      return snapshot.docs.map((doc) =>
        mapEventToResponse(doc.data() as CheckInEvent)
      )
    },

    GetCheckInDashboard: async (
      object: unknown,
      args: { eventId: string; filterScopeId?: string },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      const authId = getCurrentAuthId(context)
      const viewerScope = await resolveViewerScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )
      if (!viewerScope) throw new Error('You do not have access to this event')

      const scopeFilters = await getScopeFilters(
        context,
        viewerScope.level,
        viewerScope.id
      )
      const filterScopeId = args.filterScopeId || viewerScope.id
      const allowedScopeIds = scopeFilters.map((filter) => filter.id)
      if (!allowedScopeIds.includes(filterScopeId)) {
        throw new Error('Invalid scope filter')
      }

      const selectedFilter = scopeFilters.find(
        (filter) => filter.id === filterScopeId
      )
      const selectedScopeLevel =
        selectedFilter?.level ?? event.scopeLevel

      const eligibleMembers = await getEligibleMembers(
        context,
        selectedScopeLevel,
        filterScopeId,
        event.attendanceType
      )

      const checkins = await getCheckInRecords(event.id)
      const checkinsMap = new Map(
        checkins.map((record) => [record.memberId, record])
      )

      const checkedIn: any[] = []
      const defaulted: any[] = []
      const checkedOut: any[] = []
      const lateThreshold =
        new Date(event.startsAt).getTime() + event.gracePeriod * 60 * 1000
      const defaultedLate = Date.now() > lateThreshold

      eligibleMembers.forEach((member) => {
        const record = checkinsMap.get(member.memberId)
        const isLate =
          record?.checkedInAt &&
          new Date(record.checkedInAt).getTime() > lateThreshold

        const attendee = {
          memberId: member.memberId,
          firstName: member.firstName,
          lastName: member.lastName,
          fullName: member.fullName,
          roleLabel: member.roleLabel,
          unitName: member.unitName,
          unitType: member.unitLabels?.[0] ?? 'Bacenta',
          checkedInAt: record?.checkedInAt,
          checkInMethod: record?.checkInMethod,
          isLate: !!isLate,
          geoVerified: record?.geoVerified ?? null,
          faceMatchStatus: record?.faceMatchStatus ?? null,
          selfieUrl: record?.selfieUrl ?? null,
          checkedOutAt: record?.checkedOutAt ?? null,
          autoCheckedOut: record?.autoCheckedOut ?? null,
        }

        if (record && record.checkedOutAt) {
          checkedOut.push(attendee)
        } else if (record) {
          checkedIn.push(attendee)
        } else {
          defaulted.push({ ...attendee, isLate: defaultedLate })
        }
      })

      const totalExpected = eligibleMembers.length
      const checkedInCount = checkedIn.length
      const checkedOutCount = checkedOut.length
      const defaultedCount = totalExpected - checkedInCount - checkedOutCount
      const flaggedCount = checkins.filter(
        (r) => r.faceMatchStatus === 'FLAGGED'
      ).length
      const percentage = totalExpected
        ? Number(((checkedInCount / totalExpected) * 100).toFixed(1))
        : 0

      // Build flagged records list
      const flaggedRecords = checkins
        .filter((r) => r.faceMatchStatus === 'FLAGGED')
        .map((record) => {
          const member = eligibleMembers.find(
            (m) => m.memberId === record.memberId
          )
          return {
            record,
            attendee: {
              memberId: record.memberId,
              firstName:
                member?.firstName ??
                record.memberName?.split(' ')[0] ??
                '',
              lastName:
                member?.lastName ??
                record.memberName?.split(' ').slice(1).join(' ') ??
                '',
              fullName: member?.fullName ?? record.memberName,
              roleLabel: member?.roleLabel ?? record.memberRole,
              unitName: member?.unitName ?? record.memberUnit,
              unitType: member?.unitLabels?.[0] ?? 'Bacenta',
              checkedInAt: record.checkedInAt,
              checkInMethod: record.checkInMethod,
              isLate: false,
              geoVerified: record.geoVerified,
              faceMatchStatus: record.faceMatchStatus,
              selfieUrl: record.selfieUrl,
            },
            reason:
              record.faceMatchScore != null
                ? `Face match score: ${(record.faceMatchScore * 100).toFixed(1)}%`
                : 'Low confidence face match',
          }
        })

      return {
        event: mapEventToResponse(event),
        checkedIn,
        defaulted,
        checkedOut,
        stats: {
          totalExpected,
          checkedInCount,
          defaultedCount,
          checkedOutCount,
          percentage,
          flaggedCount,
        },
        scopeFilters,
        appliedFilterId: filterScopeId,
        flaggedRecords,
      }
    },

    GetAdminScopes: async (
      object: unknown,
      args: unknown,
      context: Context
    ) => {
      const authId = getCurrentAuthId(context)
      const adminScopes = await getAdminScopes(context, authId)
      return adminScopes.map((scope) => ({
        id: scope.id,
        name: scope.name,
        level: resolveScopeLevelFromLabels(scope.labels),
      }))
    },

    GetFlaggedCheckIns: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      const authId = getCurrentAuthId(context)
      const viewerScope = await resolveViewerScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )
      if (!viewerScope) throw new Error('You do not have access to this event')

      const flaggedRecords = await getFlaggedCheckIns(args.eventId)
      return flaggedRecords.map((record) => ({
        record,
        attendee: {
          memberId: record.memberId,
          firstName: record.memberName?.split(' ')[0] ?? '',
          lastName:
            record.memberName?.split(' ').slice(1).join(' ') ?? '',
          fullName: record.memberName,
          roleLabel: record.memberRole,
          unitName: record.memberUnit,
          unitType: 'Bacenta',
          checkedInAt: record.checkedInAt,
          checkInMethod: record.checkInMethod,
          isLate: false,
          geoVerified: record.geoVerified,
          faceMatchStatus: record.faceMatchStatus,
          selfieUrl: record.selfieUrl,
        },
        reason:
          record.faceMatchScore != null
            ? `Face match score: ${(record.faceMatchScore * 100).toFixed(1)}%`
            : 'Low confidence face match',
      }))
    },
  },

  Mutation: {
    CreateCheckInEvent: async (
      object: unknown,
      args: { input: any },
      context: Context
    ) => {
      const scopeLabel = getScopeLabel(args.input.scopeLevel)
      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      isAuth(permitAdmin(scopeLabel), userRoles)

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        args.input.scopeLevel,
        args.input.scopeId,
        userRoles
      )

      const member = await getMemberByAuthId(context, authId)
      if (!member) throw new Error('Member not found')

      const eventId = uuidv4()
      const pinCode = generatePinCode()
      const qrSecret = generateQrSecret()
      const qrRotationSeconds = 60
      const gracePeriod = args.input.gracePeriod ?? 30

      // Leaders-only is the only attendance type allowed
      const attendanceType = 'LEADERS_ONLY' as const

      const eligibleMembers = await getEligibleMembers(
        context,
        args.input.scopeLevel,
        args.input.scopeId,
        attendanceType
      )

      // Validate allowed methods
      const allowedMethods: CheckInMethod[] =
        args.input.allowedCheckInMethods?.length
          ? args.input.allowedCheckInMethods
          : ['QR']
      if (!allowedMethods.every((m: string) => ['QR', 'PIN', 'FACE_ID'].includes(m))) {
        throw new Error('Invalid check-in method. Allowed: QR, PIN, FACE_ID')
      }

      const record: CheckInEvent = {
        id: eventId,
        name: args.input.name,
        type: args.input.type,
        description: args.input.description,
        location: args.input.location,
        scopeLevel: args.input.scopeLevel,
        scopeId: args.input.scopeId,
        startsAt: args.input.startsAt,
        endsAt: args.input.endsAt,
        gracePeriod,
        attendanceType,
        status: 'ACTIVE',
        pinCode,
        qrSecret,
        qrRotationSeconds,
        createdAt: new Date().toISOString(),
        createdById: member.id,
        createdByName: `${member.firstName} ${member.lastName}`,
        createdByRole:
          context.jwt['https://flcadmin.netlify.app/roles'][0] ?? '',
        totalExpected: eligibleMembers.length,
        allowedCheckInRoles:
          args.input.allowedCheckInRoles || ['leaderBacenta'],
        allowedCheckInMethods: allowedMethods,
        // Geo-fence fields (required — geofence is mandatory)
        geoFenceType: args.input.geoFenceType,
        geoCenter: args.input.geoCenter || null,
        geoRadius: args.input.geoRadius || null,
        geoPolygon: args.input.geoPolygon || null,
        // Auto-checkout minutes (default 30)
        autoCheckoutMinutes: args.input.autoCheckoutMinutes ?? 30,
      }

      const db = await getCheckinsDb()
      if (!db) {
        throw new Error('Check-ins service is not available')
      }
      await db.collection(EVENTS_COLLECTION).doc(eventId).set(record)
      return mapEventToResponse(record)
    },

    CheckInMember: async (
      object: unknown,
      args: {
        eventId: string
        method: string
        code?: string
        deviceFingerprint: string
        latitude: number
        longitude: number
        selfieBase64?: string
        faceMatchScore?: number
        faceMatchStatus?: FaceMatchStatus
      },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      // ── Prerequisite 1: Event must be active ──
      if (event.status !== 'ACTIVE') throw new Error('Event is not active')

      // ── Prerequisite 2: Must be within the event time window ──
      if (!isWithinEventWindow(event.startsAt, event.endsAt)) {
        throw new Error('Check-in is not available outside the event time window')
      }

      // ── Prerequisite 3: Must be within the geofence ──
      const geoResult = validateGeoFence(
        event,
        args.latitude,
        args.longitude
      )
      if (!geoResult.verified) {
        throw new Error(
          `You must be within the event geofence to check in. Distance: ${geoResult.distance ?? '?'}m`
        )
      }

      const authId = getCurrentAuthId(context)
      const member = await getMemberByAuthId(context, authId)
      if (!member) throw new Error('Member not found')

      // ── Leaders-only enforcement ──
      const isLeader = await isLeaderOrAdmin(context, authId)
      if (!isLeader) {
        throw new Error('Check-in is only available for leaders')
      }

      const inScope = await isMemberInScope(
        context,
        event.scopeLevel,
        event.scopeId,
        authId
      )
      if (!inScope) throw new Error('You are not in this event scope')

      // Check if user's role is allowed to perform check-ins
      const userRoles =
        context.jwt['https://flcadmin.netlify.app/roles'] || []
      if (!isUserAllowedToCheckIn(userRoles, event.allowedCheckInRoles)) {
        throw new Error(
          `Your role is not allowed to check in for this event. Allowed roles: ${event.allowedCheckInRoles.join(', ')}`
        )
      }

      // ── Validate the method is allowed for this event ──
      const allowedMethods = event.allowedCheckInMethods || ['QR']
      if (args.method !== 'MANUAL' && !allowedMethods.includes(args.method as CheckInMethod)) {
        throw new Error(
          `Check-in method '${args.method}' is not enabled for this event. Available methods: ${allowedMethods.join(', ')}`
        )
      }

      const existing = await getCheckInRecordForMember(event.id, member.id)
      if (existing && !existing.checkedOutAt) {
        return existing
      }

      // ── One-device-per-event rule ──
      if (args.deviceFingerprint) {
        await enforceOneDevicePerEvent(
          event.id,
          member.id,
          args.deviceFingerprint
        )
      }

      // ── Method-specific validation ──
      if (args.method === 'PIN') {
        if (!args.code) throw new Error('PIN code is required')
        await enforcePinAttemptPolicy(event.id, authId)
        if (args.code !== event.pinCode) {
          await recordFailedPinAttempt(event.id, authId)
          throw new Error('Invalid PIN')
        }
        await clearPinAttempts(event.id, authId)
      }

      if (args.method === 'QR') {
        if (!args.code) throw new Error('QR code is required')
        const isValidQr = validateQrToken(
          event.id,
          event.qrSecret,
          event.qrRotationSeconds,
          args.code
        )
        if (!isValidQr) throw new Error('Invalid QR code')
      }

      if (args.method === 'FACE_ID') {
        // Face ID method: client must send face match data
        if (!args.faceMatchScore && args.faceMatchScore !== 0) {
          throw new Error('Face recognition data is required for FACE_ID check-in')
        }
        if (args.faceMatchStatus === 'FLAGGED' || args.faceMatchStatus === 'SKIPPED') {
          throw new Error('Face recognition did not pass verification. Please try again.')
        }
      }

      const record = {
        id: uuidv4(),
        eventId: event.id,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        memberRole: 'Leader/Admin',
        memberUnit: await getMemberUnitName(context, member.id),
        checkedInAt: new Date().toISOString(),
        checkInMethod: args.method,
        verifiedBy: 'system',
        // Geo-verify results
        geoVerified: geoResult.verified,
        distanceFromVenue: geoResult.distance,
        // Device fingerprint
        deviceFingerprint: args.deviceFingerprint || null,
        // Selfie & face-match (client sends these)
        selfieUrl: args.selfieBase64 || null,
        faceMatchScore: args.faceMatchScore ?? null,
        faceMatchStatus: args.faceMatchStatus || 'SKIPPED',
        // Checkout fields
        checkedOutAt: null,
        autoCheckedOut: false,
      }

      const db = await getCheckinsDb()
      if (!db) {
        throw new Error('Check-ins service is not available')
      }
      await db.collection(CHECKINS_COLLECTION).doc(record.id).set(record)
      return record
    },

    ManualCheckIn: async (
      object: unknown,
      args: {
        eventId: string
        memberId: string
        latitude: number
        longitude: number
        reason?: string
      },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      const scopeLabel = getScopeLabel(event.scopeLevel)
      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      isAuth(permitAdmin(scopeLabel), userRoles)

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      if (event.status !== 'ACTIVE') throw new Error('Event is not active')
      if (!isWithinEventWindow(event.startsAt, event.endsAt)) {
        throw new Error('Event is not accepting check-ins at this time')
      }

      // ── Geofence is always enforced, even for manual admin check-ins ──
      const geoResult = validateGeoFence(event, args.latitude, args.longitude)
      if (!geoResult.verified) {
        throw new Error(
          `You must be within the event geofence to manually check in a member. Distance: ${geoResult.distance ?? '?'}m`
        )
      }

      const session = context.executionContext.session()
      try {
        const memberRes = await session.run(
          `MATCH (member:Member {id: $memberId})
           RETURN member.id AS id, member.firstName AS firstName, member.lastName AS lastName`,
          { memberId: args.memberId }
        )
        if (!memberRes.records[0]) throw new Error('Member not found')

        const inScope = await isMemberIdInScope(
          context,
          event.scopeLevel,
          event.scopeId,
          args.memberId
        )
        if (!inScope)
          throw new Error('Member is not in this event scope')

        // Leaders-only enforcement
        const memberIsLeader = await isMemberLeaderOrAdminById(
          context,
          args.memberId
        )
        if (!memberIsLeader)
          throw new Error('Check-in is only available for leaders')

        const existing = await getCheckInRecordForMember(
          event.id,
          args.memberId
        )
        if (existing) return existing

        const record = {
          id: uuidv4(),
          eventId: event.id,
          memberId: memberRes.records[0].get('id'),
          memberName: `${memberRes.records[0].get('firstName')} ${memberRes.records[0].get('lastName')}`,
          memberRole: 'Manual',
          memberUnit: await getMemberUnitName(
            context,
            memberRes.records[0].get('id')
          ),
          checkedInAt: new Date().toISOString(),
          checkInMethod: 'MANUAL',
          verifiedBy: args.reason || 'admin',
        }

        const db = await getCheckinsDb()
        if (!db) {
          throw new Error('Check-ins service is not available')
        }
        await db
          .collection(CHECKINS_COLLECTION)
          .doc(record.id)
          .set(record)
        return record
      } finally {
        await session.close()
      }
    },

    UpdateCheckInEventDuration: async (
      object: unknown,
      args: { eventId: string; endsAt: string },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      const scopeLabel = getScopeLabel(event.scopeLevel)
      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      isAuth(permitAdmin(scopeLabel), userRoles)

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      await eventDoc.update({ endsAt: args.endsAt })
      const updated = { ...event, endsAt: args.endsAt }
      return mapEventToResponse(updated)
    },

    PauseCheckInEvent: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      const scopeLabel = getScopeLabel(event.scopeLevel)
      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      isAuth(permitAdmin(scopeLabel), userRoles)

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      await eventDoc.update({ status: 'PAUSED' })
      return mapEventToResponse({ ...event, status: 'PAUSED' })
    },

    ResumeCheckInEvent: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      const scopeLabel = getScopeLabel(event.scopeLevel)
      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      isAuth(permitAdmin(scopeLabel), userRoles)

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      await eventDoc.update({ status: 'ACTIVE' })
      return mapEventToResponse({ ...event, status: 'ACTIVE' })
    },

    ResetCheckInEventPin: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      const scopeLabel = getScopeLabel(event.scopeLevel)
      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      isAuth(permitAdmin(scopeLabel), userRoles)

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      const pinCode = generatePinCode()
      await eventDoc.update({ pinCode })
      return mapEventToResponse({ ...event, pinCode })
    },

    EndCheckInEvent: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      const scopeLabel = getScopeLabel(event.scopeLevel)
      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      isAuth(permitAdmin(scopeLabel), userRoles)

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      await eventDoc.update({ status: 'ENDED' })
      return mapEventToResponse({ ...event, status: 'ENDED' })
    },

    CheckOutMember: async (
      object: unknown,
      args: {
        eventId: string
        latitude: number
        longitude: number
        deviceFingerprint: string
      },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      const authId = getCurrentAuthId(context)
      const member = await getMemberByAuthId(context, authId)
      if (!member) throw new Error('Member not found')

      const existing = await getCheckInRecordForMember(event.id, member.id)
      if (!existing) {
        throw new Error('No active check-in record found')
      }
      if (existing.checkedOutAt) {
        return existing // already checked out
      }

      // Verify the member is actually outside the geofence
      const geoResult = validateGeoFence(event, args.latitude, args.longitude)

      const db = await getCheckinsDb()
      if (!db) throw new Error('Check-ins service is not available')
      const recordDoc = db.collection(CHECKINS_COLLECTION).doc(existing.id)

      const updatedRecord = {
        ...existing,
        checkedOutAt: new Date().toISOString(),
        autoCheckedOut: true,
      }
      await recordDoc.update({
        checkedOutAt: updatedRecord.checkedOutAt,
        autoCheckedOut: true,
      })
      return updatedRecord
    },

    ReportMemberLocation: async (
      object: unknown,
      args: { eventId: string; latitude: number; longitude: number },
      context: Context
    ) => {
      const eventDoc = await getEventDoc(args.eventId)
      if (!eventDoc) return null
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) return null
      const event = eventSnapshot.data() as CheckInEvent

      if (event.status !== 'ACTIVE') return null

      const authId = getCurrentAuthId(context)
      const member = await getMemberByAuthId(context, authId)
      if (!member) return null

      const existing = await getCheckInRecordForMember(event.id, member.id)
      if (!existing || existing.checkedOutAt) return existing ?? null

      // Check if member is now outside the geofence
      const geoResult = validateGeoFence(event, args.latitude, args.longitude)
      if (geoResult.verified) {
        // Still inside — nothing to do
        return existing
      }

      // Outside the geofence — auto-checkout immediately
      const db = await getCheckinsDb()
      if (!db) return existing

      const checkedOutAt = new Date().toISOString()
      const recordDoc = db.collection(CHECKINS_COLLECTION).doc(existing.id)
      await recordDoc.update({ checkedOutAt, autoCheckedOut: true })

      return { ...existing, checkedOutAt, autoCheckedOut: true }
    },

    ResolveFlaggedCheckIn: async (
      object: unknown,
      args: { recordId: string; resolution: string },
      context: Context
    ) => {
      const db = await getCheckinsDb()
      if (!db) throw new Error('Check-ins service is not available')

      const recordDoc = db.collection(CHECKINS_COLLECTION).doc(args.recordId)
      const recordSnapshot = await recordDoc.get()
      if (!recordSnapshot.exists)
        throw new Error('Check-in record not found')
      const record = recordSnapshot.data()!

      // Verify caller is admin for the event
      const eventDoc = await getEventDoc(record.eventId)
      if (!eventDoc) throw new Error('Check-ins service is not available')
      const eventSnapshot = await eventDoc.get()
      if (!eventSnapshot.exists) throw new Error('Event not found')
      const event = eventSnapshot.data() as CheckInEvent

      const scopeLabel = getScopeLabel(event.scopeLevel)
      const userRoles =
        context.jwt?.['https://flcadmin.netlify.app/roles'] || []
      isAuth(permitAdmin(scopeLabel), userRoles)

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      const newStatus =
        args.resolution === 'VERIFY' ? 'VERIFIED' : 'FLAGGED'
      await recordDoc.update({
        faceMatchStatus: newStatus,
        verifiedBy: `admin:${authId}`,
      })
      return {
        ...record,
        faceMatchStatus: newStatus,
        verifiedBy: `admin:${authId}`,
      }
    },
  },
}

export default checkinsResolvers
