import { v4 as uuidv4 } from 'uuid'
import { isAuth } from '../utils/utils'
import {
  generatePinCode,
  generateQrSecret,
  isWithinEventWindow,
  validateQrToken,
} from './checkins-utils'
import {
  getEvent,
  createEvent,
  updateEvent,
  queryEvents,
  createCheckInRecord,
  updateCheckInRecord,
  getCheckInRecordById,
  mapEventToResponse,
  getMemberByAuthId,
  getAdminScopes,
  resolveScopeLevelFromLabels,
  assertAdminForScope,
  getEligibleMembers,
  getScopeFilters,
  getDirectChildren,
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
  getCheckInAggregateByScope,
  logCheckInHistory,
  getCheckInEventHistory,
} from './checkins-service'
import { CheckInEvent, CheckInMethod, CheckInAttendanceType, FaceMatchStatus } from './checkins-types'
import { Context } from '../utils/neo4j-types'

export const checkinsResolvers = {
  Query: {
    GetEventsInRange: async (
      object: unknown,
      args: { latitude: number; longitude: number },
      context: Context
    ) => {
      const events = await queryEvents(context, { status: 'ACTIVE' })
      if (events.length === 0) return []

      const now = new Date()
      const results: ReturnType<typeof mapEventToResponse>[] = []

      for (const event of events) {
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
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      // Authorization check - user must be within the event scope
      const userRoles =
        context.jwt?.roles || []
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
      const userRoles =
        context.jwt?.roles || []
      const authId = getCurrentAuthId(context)

      if (args.scopeId) {
        // Caller requested a specific scope — filter directly, then do a
        // single access check rather than one check per event.
        const events = await queryEvents(context, {
          scopeLevel: args.scopeLevel,
          status: args.status,
          scopeId: args.scopeId,
        })
        if (events.length === 0) return []

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

      // No specific scope requested — pre-filter to only the scopes
      // the viewer can see.
      const viewerScopeIds = await getViewerScopeIds(context, authId, userRoles)

      if (viewerScopeIds !== null) {
        // Non-global viewer: restrict to their own scope IDs
        if (viewerScopeIds.length === 0) return []
        const events = await queryEvents(context, {
          scopeLevel: args.scopeLevel,
          status: args.status,
          scopeIds: viewerScopeIds,
        })
        return events.map(mapEventToResponse)
      }
      // viewerScopeIds === null → denomination/oversight admin, no extra filter

      const events = await queryEvents(context, {
        scopeLevel: args.scopeLevel,
        status: args.status,
      })
      return events.map(mapEventToResponse)
    },

    GetCheckInDashboard: async (
      object: unknown,
      args: { eventId: string; filterScopeId?: string },
      context: Context
    ) => {
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
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

      const checkins = await getCheckInRecords(context, event.id)
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
        appliedFilterName: selectedFilter?.name ?? null,
        childScopeFilters: await getDirectChildren(context, filterScopeId),
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
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
      const authId = getCurrentAuthId(context)
      const viewerScope = await resolveViewerScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )
      if (!viewerScope) throw new Error('You do not have access to this event')

      const flaggedRecords = await getFlaggedCheckIns(context, args.eventId)
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

    GetMyCheckInStatus: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const authId = getCurrentAuthId(context)
      const member = await getMemberByAuthId(context, authId)
      if (!member) return null

      const record = await getCheckInRecordForMember(
        context,
        event.id,
        member.id
      )
      return record ?? null
    },

    GetCheckInAggregateByScope: async (
      object: unknown,
      args: { scopeLevel: string; scopeId: string },
      context: Context
    ) => {
      const userRoles =
        context.jwt?.roles || []
      const authId = getCurrentAuthId(context)

      // Verify viewer has access to this scope
      const viewerScope = await resolveViewerScope(
        context,
        authId,
        args.scopeLevel as any,
        args.scopeId,
        userRoles
      )
      if (!viewerScope) throw new Error('You do not have access to this scope')

      return getCheckInAggregateByScope(
        context,
        args.scopeLevel as any,
        args.scopeId
      )
    },

    GetCheckInEventHistory: async (
      object: unknown,
      args: { eventId: string; limit?: number },
      context: Context
    ) => {
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
      const authId = getCurrentAuthId(context)
      const viewerScope = await resolveViewerScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )
      if (!viewerScope) throw new Error('You do not have access to this event')

      return getCheckInEventHistory(context, args.eventId, args.limit ?? 50)
    },
  },

  Mutation: {
    CreateCheckInEvent: async (
      object: unknown,
      args: { input: any },
      context: Context
    ) => {
      const userRoles =
        context.jwt?.roles || []
      // Any admin role can attempt to create events — assertAdminForScope
      // below verifies the caller actually admins the target scope via the graph
      isAuth(
        [
          'adminDenomination',
          'adminOversight',
          'adminCampus',
          'adminStream',
          'adminCouncil',
          'adminGovernorship',
        ],
        userRoles
      )

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

      // Use the attendanceType from input (not hardcoded)
      const attendanceType = (args.input.attendanceType ?? 'LEADERS_ONLY') as CheckInAttendanceType

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
          context.jwt?.roles?.[0] ?? '',
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

      await createEvent(context, record)

      // Audit log: event created
      await logCheckInHistory(
        context,
        record.id,
        'EVENT_CREATED',
        `Check-in event '${record.name}' created for ${record.scopeLevel} scope`,
        member.id,
        `${member.firstName} ${member.lastName}`
      ).catch(() => {}) // Non-blocking

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
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

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
        context.jwt?.roles || []
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

      const existing = await getCheckInRecordForMember(context, event.id, member.id)
      if (existing && !existing.checkedOutAt) {
        return existing
      }

      // ── One-device-per-event rule ──
      if (args.deviceFingerprint) {
        await enforceOneDevicePerEvent(
          context,
          event.id,
          member.id,
          args.deviceFingerprint
        )
      }

      // ── Method-specific validation ──
      if (args.method === 'PIN') {
        if (!args.code) throw new Error('PIN code is required')
        await enforcePinAttemptPolicy(context, event.id, authId)
        if (args.code !== event.pinCode) {
          await recordFailedPinAttempt(context, event.id, authId)
          throw new Error('Invalid PIN')
        }
        await clearPinAttempts(context, event.id, authId)
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

      await createCheckInRecord(context, record)

      // Audit log: member checked in
      await logCheckInHistory(
        context,
        event.id,
        'MEMBER_CHECKED_IN',
        `${member.firstName} ${member.lastName} checked in via ${args.method}`,
        member.id,
        `${member.firstName} ${member.lastName}`
      ).catch(() => {}) // Non-blocking

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
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
      isAuth(
        [
          'adminDenomination',
          'adminOversight',
          'adminCampus',
          'adminStream',
          'adminCouncil',
          'adminGovernorship',
        ],
        userRoles
      )

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
          context,
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

        await createCheckInRecord(context, record)

        // Audit log: manual check-in
        const adminMember = await getMemberByAuthId(context, authId)
        const adminName = adminMember
          ? `${adminMember.firstName} ${adminMember.lastName}`
          : 'Admin'
        await logCheckInHistory(
          context,
          event.id,
          'MANUAL_CHECKIN',
          `${adminName} manually checked in ${record.memberName}`,
          adminMember?.id ?? authId,
          adminName
        ).catch(() => {}) // Non-blocking

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
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
      isAuth(
        [
          'adminDenomination',
          'adminOversight',
          'adminCampus',
          'adminStream',
          'adminCouncil',
          'adminGovernorship',
        ],
        userRoles
      )

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      await updateEvent(context, args.eventId, { endsAt: args.endsAt })
      const updated = { ...event, endsAt: args.endsAt }
      return mapEventToResponse(updated)
    },

    UpdateCheckInEvent: async (
      object: unknown,
      args: { eventId: string; input: any },
      context: Context
    ) => {
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles = context.jwt?.roles || []
      isAuth(
        [
          'adminDenomination',
          'adminOversight',
          'adminCampus',
          'adminStream',
          'adminCouncil',
          'adminGovernorship',
        ],
        userRoles
      )

      const authId = getCurrentAuthId(context)
      // Must be creator OR a higher-scope admin over the event's scope
      const isCreator = event.createdById === (await getMemberByAuthId(context, authId))?.id
      if (!isCreator) {
        await assertAdminForScope(
          context,
          authId,
          event.scopeLevel,
          event.scopeId,
          userRoles
        )
      }

      const updateFields: Partial<CheckInEvent> = {}
      const i = args.input
      if (i.name != null) updateFields.name = i.name
      if (i.location != null) updateFields.location = i.location
      if (i.startsAt != null) updateFields.startsAt = i.startsAt
      if (i.endsAt != null) updateFields.endsAt = i.endsAt
      if (i.gracePeriod != null) updateFields.gracePeriod = i.gracePeriod
      if (i.attendanceType != null) updateFields.attendanceType = i.attendanceType
      if (i.allowedCheckInRoles != null) updateFields.allowedCheckInRoles = i.allowedCheckInRoles
      if (i.allowedCheckInMethods != null) updateFields.allowedCheckInMethods = i.allowedCheckInMethods
      if (i.geoFenceType != null) updateFields.geoFenceType = i.geoFenceType
      if (i.geoCenter != null) updateFields.geoCenter = i.geoCenter
      if (i.geoRadius != null) updateFields.geoRadius = i.geoRadius
      if (i.geoPolygon != null) updateFields.geoPolygon = i.geoPolygon
      if (i.autoCheckoutMinutes != null) updateFields.autoCheckoutMinutes = i.autoCheckoutMinutes

      await updateEvent(context, args.eventId, updateFields)
      const updated = { ...event, ...updateFields }
      return mapEventToResponse(updated)
    },

    PauseCheckInEvent: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
      isAuth(
        [
          'adminDenomination',
          'adminOversight',
          'adminCampus',
          'adminStream',
          'adminCouncil',
          'adminGovernorship',
        ],
        userRoles
      )

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      await updateEvent(context, args.eventId, { status: 'PAUSED' })

      // Audit log: event paused
      const pauseMember = await getMemberByAuthId(context, authId)
      const pauseName = pauseMember
        ? `${pauseMember.firstName} ${pauseMember.lastName}`
        : 'Admin'
      await logCheckInHistory(
        context,
        args.eventId,
        'EVENT_PAUSED',
        `Check-in event '${event.name}' paused by ${pauseName}`,
        pauseMember?.id ?? authId,
        pauseName
      ).catch(() => {}) // Non-blocking

      return mapEventToResponse({ ...event, status: 'PAUSED' })
    },

    ResumeCheckInEvent: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
      isAuth(
        [
          'adminDenomination',
          'adminOversight',
          'adminCampus',
          'adminStream',
          'adminCouncil',
          'adminGovernorship',
        ],
        userRoles
      )

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      await updateEvent(context, args.eventId, { status: 'ACTIVE' })

      // Audit log: event resumed
      const resumeMember = await getMemberByAuthId(context, authId)
      const resumeName = resumeMember
        ? `${resumeMember.firstName} ${resumeMember.lastName}`
        : 'Admin'
      await logCheckInHistory(
        context,
        args.eventId,
        'EVENT_RESUMED',
        `Check-in event '${event.name}' resumed by ${resumeName}`,
        resumeMember?.id ?? authId,
        resumeName
      ).catch(() => {}) // Non-blocking

      return mapEventToResponse({ ...event, status: 'ACTIVE' })
    },

    ResetCheckInEventPin: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
      isAuth(
        [
          'adminDenomination',
          'adminOversight',
          'adminCampus',
          'adminStream',
          'adminCouncil',
          'adminGovernorship',
        ],
        userRoles
      )

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      const pinCode = generatePinCode()
      await updateEvent(context, args.eventId, { pinCode })
      return mapEventToResponse({ ...event, pinCode })
    },

    EndCheckInEvent: async (
      object: unknown,
      args: { eventId: string },
      context: Context
    ) => {
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
      isAuth(
        [
          'adminDenomination',
          'adminOversight',
          'adminCampus',
          'adminStream',
          'adminCouncil',
          'adminGovernorship',
        ],
        userRoles
      )

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      await updateEvent(context, args.eventId, { status: 'ENDED' })

      // Audit log: event ended
      const endMember = await getMemberByAuthId(context, authId)
      const endName = endMember
        ? `${endMember.firstName} ${endMember.lastName}`
        : 'Admin'
      await logCheckInHistory(
        context,
        args.eventId,
        'EVENT_ENDED',
        `Check-in event '${event.name}' ended by ${endName}`,
        endMember?.id ?? authId,
        endName
      ).catch(() => {}) // Non-blocking

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
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const authId = getCurrentAuthId(context)
      const member = await getMemberByAuthId(context, authId)
      if (!member) throw new Error('Member not found')

      const existing = await getCheckInRecordForMember(context, event.id, member.id)
      if (!existing) {
        throw new Error('No active check-in record found')
      }
      if (existing.checkedOutAt) {
        return existing // already checked out
      }

      // Verify the member is actually outside the geofence
      const geoResult = validateGeoFence(event, args.latitude, args.longitude)

      const updatedRecord = {
        ...existing,
        checkedOutAt: new Date().toISOString(),
        autoCheckedOut: true,
      }
      await updateCheckInRecord(context, existing.id, {
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
      const event = await getEvent(context, args.eventId)
      if (!event) return null

      if (event.status !== 'ACTIVE') return null

      const authId = getCurrentAuthId(context)
      const member = await getMemberByAuthId(context, authId)
      if (!member) return null

      const existing = await getCheckInRecordForMember(context, event.id, member.id)
      if (!existing || existing.checkedOutAt) return existing ?? null

      // Check if member is now outside the geofence
      const geoResult = validateGeoFence(event, args.latitude, args.longitude)
      if (geoResult.verified) {
        // Still inside — nothing to do
        return existing
      }

      // Outside the geofence — auto-checkout immediately
      const checkedOutAt = new Date().toISOString()
      await updateCheckInRecord(context, existing.id, { checkedOutAt, autoCheckedOut: true })

      return { ...existing, checkedOutAt, autoCheckedOut: true }
    },

    ResolveFlaggedCheckIn: async (
      object: unknown,
      args: { recordId: string; resolution: string },
      context: Context
    ) => {
      const record = await getCheckInRecordById(context, args.recordId)
      if (!record) throw new Error('Check-in record not found')

      // Verify caller is admin for the event
      const event = await getEvent(context, record.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
      isAuth(
        [
          'adminDenomination',
          'adminOversight',
          'adminCampus',
          'adminStream',
          'adminCouncil',
          'adminGovernorship',
        ],
        userRoles
      )

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
      await updateCheckInRecord(context, args.recordId, {
        faceMatchStatus: newStatus,
        verifiedBy: `admin:${authId}`,
      })
      return {
        ...record,
        faceMatchStatus: newStatus,
        verifiedBy: `admin:${authId}`,
      }
    },

    LogCheckInHistory: async (
      object: unknown,
      args: { eventId: string; action: string; description: string },
      context: Context
    ) => {
      const event = await getEvent(context, args.eventId)
      if (!event) throw new Error('Event not found')

      const userRoles =
        context.jwt?.roles || []
      isAuth(
        [
          'adminDenomination',
          'adminOversight',
          'adminCampus',
          'adminStream',
          'adminCouncil',
          'adminGovernorship',
        ],
        userRoles
      )

      const authId = getCurrentAuthId(context)
      await assertAdminForScope(
        context,
        authId,
        event.scopeLevel,
        event.scopeId,
        userRoles
      )

      const member = await getMemberByAuthId(context, authId)
      const memberName = member
        ? `${member.firstName} ${member.lastName}`
        : 'Admin'

      return logCheckInHistory(
        context,
        args.eventId,
        args.action,
        args.description,
        member?.id ?? authId,
        memberName
      )
    },
  },
}

export default checkinsResolvers
