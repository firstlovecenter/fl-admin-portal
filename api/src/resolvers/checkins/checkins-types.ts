export type CheckInScopeLevel =
  | 'OVERSIGHT'
  | 'CAMPUS'
  | 'STREAM'
  | 'COUNCIL'
  | 'GOVERNORSHIP'
  | 'BACENTA'

export type CheckInAttendanceType = 'LEADERS_ONLY'

export type CheckInStatus = 'ACTIVE' | 'PAUSED' | 'ENDED'

export type CheckInMethod = 'QR' | 'PIN' | 'FACE_ID' | 'MANUAL'

export type GeoFenceType = 'CIRCLE' | 'POLYGON'

export type FaceMatchStatus = 'PENDING' | 'VERIFIED' | 'FLAGGED' | 'SKIPPED'

export type CheckInRoleType =
  | 'leaderBacenta'
  | 'leaderCouncil'
  | 'leaderStream'
  | 'leaderGovernorship'

export interface GeoPoint {
  latitude: number
  longitude: number
}

export interface CheckInEvent {
  id: string
  name: string
  type: string
  description?: string
  location?: string
  scopeLevel: CheckInScopeLevel
  scopeId: string
  startsAt: string
  endsAt: string
  gracePeriod: number
  attendanceType: CheckInAttendanceType
  status: CheckInStatus
  pinCode: string
  qrSecret: string
  qrRotationSeconds: number
  createdAt: string
  createdById: string
  createdByName: string
  createdByRole: string
  totalExpected: number
  allowedCheckInRoles: CheckInRoleType[]
  /** Methods available for check-in: QR, PIN, FACE_ID */
  allowedCheckInMethods: CheckInMethod[]
  geoFenceType: GeoFenceType
  geoCenter?: GeoPoint | null
  geoRadius?: number | null
  geoPolygon?: GeoPoint[] | null
  /** Minutes outside geofence before auto-checkout (default 30) */
  autoCheckoutMinutes: number
}

export interface CheckInRecord {
  id: string
  eventId: string
  memberId: string
  memberName: string
  memberRole: string
  memberUnit: string
  checkedInAt: string
  checkInMethod: CheckInMethod
  verifiedBy: string
  geoVerified?: boolean | null
  distanceFromVenue?: number | null
  selfieUrl?: string | null
  faceMatchScore?: number | null
  faceMatchStatus?: FaceMatchStatus | null
  deviceFingerprint?: string | null
  /** Timestamp when the member was checked out (null if still checked in) */
  checkedOutAt?: string | null
  /** Whether the checkout was triggered automatically by geofence monitoring */
  autoCheckedOut?: boolean | null
}

export interface EligibleMember {
  memberId: string
  firstName: string
  lastName: string
  fullName: string
  unitName: string
  unitLabels: string[]
  roleLabel: string
}

export interface ScopeFilter {
  id: string
  name: string
  level: CheckInScopeLevel
}

export interface AdminScope {
  id: string
  name: string
  labels: string[]
}

export interface ViewerScope {
  id: string
  level: CheckInScopeLevel
}

export interface GeoValidationResult {
  verified: boolean
  distance: number | null
}

export interface CreateCheckInEventInput {
  name: string
  type: string
  description?: string
  location?: string
  scopeLevel: CheckInScopeLevel
  scopeId: string
  startsAt: string
  endsAt: string
  gracePeriod?: number
  attendanceType: CheckInAttendanceType
  allowedCheckInRoles: CheckInRoleType[]
  allowedCheckInMethods: CheckInMethod[]
  geoFenceType: GeoFenceType
  geoCenter?: GeoPoint
  geoRadius?: number
  geoPolygon?: GeoPoint[]
  autoCheckoutMinutes?: number
}
