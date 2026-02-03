import { LazyRouteTypes } from 'global-types'
import { permitLeaderAdmin } from 'permission-utils'
import { lazy } from 'react'

const RecordMinistryOnStageAttendance = lazy(
  () => import('./RecordMinistryOnStageAttendance')
)
const MinistryOnStageAttendanceDetails = lazy(
  () => import('./MinistryOnStageAttendanceDetails')
)

export const onStageRoutes: LazyRouteTypes[] = [
  // On Stage Attendance Things
  {
    path: '/ministry/record-onstage-attendance',
    element: RecordMinistryOnStageAttendance,
    roles: permitLeaderAdmin('Ministry'),
  },
  {
    path: '/ministry/onstage-attendance-details',
    element: MinistryOnStageAttendanceDetails,
    roles: permitLeaderAdmin('Ministry'),
  },
]
