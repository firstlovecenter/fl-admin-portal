import {
  permitAdminArrivals,
  permitArrivalsCounter,
  permitLeaderAdminArrivals,
  permitArrivalsHelpers,
  permitArrivalsPayer,
} from 'permission-utils'
import { LazyRouteTypes } from 'global-types'
import { lazy } from 'react'

const Arrivals = lazy(() => import('pages/arrivals/Arrivals'))
const BacentaArrivals = lazy(() => import('pages/arrivals/BacentaArrivals'))
const StateBacentasNoActivity = lazy(
  () => import('./pages-state-of-arrivals/StateBacentasNoActivity')
)
const BacentasOnTheWay = lazy(
  () => import('./pages-state-of-arrivals/StateBacentasOnTheWay')
)
const BusFormConfirmation = lazy(
  () => import('./pages-forms/FormAttendanceConfirmation')
)
const PayVehicleRecord = lazy(
  () => import('./pages-forms/FormPayVehicleRecord')
)
const BusFormDetails = lazy(() => import('pages/arrivals/BusFormDetails'))
const OnTheWaySubmission = lazy(
  () => import('pages/arrivals/pages-forms/FormAddVehicleRecord')
)
const GovernorshipDashboard = lazy(
  () => import('./pages-dashboards/DashboardGovernorship')
)
const CouncilDashboard = lazy(
  () => import('./pages-dashboards/DashboardCouncil')
)
const MobilisationSubmission = lazy(
  () => import('./pages-forms/FormMobilisationSubmission')
)
const MobilisationPicture = lazy(() => import('./PreMobilisationPicture'))
const BacentasMobilising = lazy(
  () => import('./pages-state-of-arrivals/StateBacentasMobilising')
)
const StreamDashboard = lazy(() => import('./pages-dashboards/DashboardStream'))
const GatheringSerivceDashboard = lazy(
  () => import('./pages-dashboards/DashboardCampus')
)
const BacentasHaveArrived = lazy(
  () => import('./pages-state-of-arrivals/StateBacentasArrived')
)
const CampusByStream = lazy(() => import('./pages-breakdowns/CampusByStream'))
const StreamByCouncil = lazy(() => import('./pages-breakdowns/StreamByCouncil'))
const CouncilByGovernorship = lazy(
  () => import('./pages-breakdowns/CouncilByGovernorship')
)

const StateBacentasToCount = lazy(
  () => import('./pages-state-of-arrivals/StateBacentasToCount')
)
const SetArrivalsTime = lazy(() => import('./Times/SetArrivalsTimes'))
const ArrivalTimes = lazy(() => import('./Times/ArrivalTimes'))
const ArrivalsCounters = lazy(() => import('./Helpers/ArrivalsCounters'))
const ArrivalsPayerSelect = lazy(() => import('./Helpers/ArrivalsPayers'))
const BacentasBelow8 = lazy(
  () => import('./pages-state-of-arrivals/StateBacentasBelow8')
)
const VehiclesToBePaid = lazy(
  () => import('./pages-state-of-arrivals/StateVehiclesToBePaid')
)
const BusVehicleFormDetails = lazy(() => import('./BusVehicleFormDetails'))
const ArrivalsPaymentData = lazy(
  () => import('./arrival-payment-data/ArrivalsPaymentData')
)

export const arrivals: LazyRouteTypes[] = [
  {
    path: '/arrivals',
    element: Arrivals,
    placeholder: true,
    roles: [
      ...permitLeaderAdminArrivals('Bacenta'),
      ...permitArrivalsHelpers('Stream'),
    ],
  },

  //Main Arrivals Pages for the Different Churches
  {
    path: '/arrivals/bacenta',
    roles: permitLeaderAdminArrivals('Bacenta'),
    element: BacentaArrivals,
    placeholder: true,
  },
  {
    path: '/arrivals/governorship',
    roles: permitLeaderAdminArrivals('Governorship'),
    element: GovernorshipDashboard,
    placeholder: true,
  },

  {
    path: '/arrivals/council',
    roles: [...permitLeaderAdminArrivals('Council'), ...permitArrivalsPayer()],
    element: CouncilDashboard,
    placeholder: true,
  },
  {
    path: '/arrivals/stream',
    roles: [
      ...permitLeaderAdminArrivals('Stream'),
      ...permitArrivalsHelpers('Stream'),
    ],
    element: StreamDashboard,
    placeholder: true,
  },
  {
    path: '/arrivals/campus',
    roles: permitLeaderAdminArrivals('Campus'),
    element: GatheringSerivceDashboard,
    placeholder: true,
  },

  //Drilling Down
  {
    path: '/arrivals/council-by-governorship',
    roles: permitLeaderAdminArrivals('Council'),
    element: CouncilByGovernorship,
    placeholder: true,
  },
  {
    path: '/arrivals/stream-by-council',
    roles: permitLeaderAdminArrivals('Stream'),
    element: StreamByCouncil,
    placeholder: true,
  },
  {
    path: '/arrivals/campus-by-stream',
    roles: permitLeaderAdminArrivals('Campus'),
    element: CampusByStream,
    placeholder: true,
  },

  //Bacenta Forms that need to be Filled
  {
    path: '/arrivals/submit-vehicle-record',
    roles: ['leaderBacenta'],
    element: OnTheWaySubmission,
    placeholder: false,
  },
  {
    path: '/arrivals/submit-mobilisation-picture',
    roles: ['leaderBacenta'],
    element: MobilisationSubmission,
    placeholder: false,
  },

  {
    path: '/arrivals/bacentas-no-activity',
    roles: [
      ...permitLeaderAdminArrivals('Governorship'),
      ...permitArrivalsHelpers('Stream'),
    ],
    element: StateBacentasNoActivity,
    placeholder: true,
  },
  {
    path: '/arrivals/bacentas-mobilising',
    roles: [
      ...permitLeaderAdminArrivals('Governorship'),
      ...permitArrivalsHelpers('Stream'),
    ],
    element: BacentasMobilising,
    placeholder: true,
  },
  {
    path: '/arrivals/bacentas-on-the-way',
    roles: [...permitLeaderAdminArrivals('Governorship')],
    element: BacentasOnTheWay,
    placeholder: true,
  },
  {
    path: '/arrivals/bacentas-to-count',
    roles: permitArrivalsCounter(),
    element: StateBacentasToCount,
    placeholder: true,
  },
  {
    path: '/arrivals/vehicles-to-be-paid',
    roles: permitArrivalsPayer(),
    element: VehiclesToBePaid,
  },
  {
    path: '/arrivals/pay-vehicle',
    roles: permitArrivalsPayer(),
    element: PayVehicleRecord,
  },
  {
    path: '/arrivals/bacentas-have-arrived',
    roles: [
      ...permitLeaderAdminArrivals('Governorship'),
      ...permitArrivalsHelpers('Stream'),
    ],
    element: BacentasHaveArrived,
    placeholder: true,
  },
  {
    path: '/arrivals/bacentas-below-8',
    roles: permitLeaderAdminArrivals('Governorship'),
    element: BacentasBelow8,
    placeholder: false,
  },

  //Bacenta Forms
  {
    path: '/arrivals/submit-vehicle-attendance',
    roles: permitArrivalsCounter(),
    element: BusFormConfirmation,
    placeholder: false,
  },
  {
    path: '/bacenta/vehicle-details',
    roles: [
      ...permitArrivalsHelpers('Stream'),
      ...permitLeaderAdminArrivals('Bacenta'),
    ],
    element: BusVehicleFormDetails,
  },
  {
    path: '/bacenta/bussing-details',
    roles: [
      ...permitArrivalsHelpers('Stream'),
      ...permitLeaderAdminArrivals('Bacenta'),
    ],
    element: BusFormDetails,
    placeholder: false,
  },
  {
    path: '/arrivals/mobilisation-picture',
    roles: permitLeaderAdminArrivals('Bacenta'),
    element: MobilisationPicture,
    placeholder: false,
  },

  //Arrivals Helpers

  {
    path: '/stream/arrivals-counters',
    roles: permitAdminArrivals('Stream'),
    element: ArrivalsCounters,
  },
  {
    path: '/council/arrivals-payers',
    roles: permitAdminArrivals('Campus'),
    element: ArrivalsPayerSelect,
  },

  //Arrivals Times
  {
    path: '/stream/arrival-times',
    roles: permitAdminArrivals('Stream'),
    element: ArrivalTimes,
    placeholder: false,
  },
  {
    path: '/stream/set-arrivals-time',
    roles: permitAdminArrivals('Stream'),
    element: SetArrivalsTime,
    placeholder: false,
  },

  //Arrivals Excel Data
  {
    path: '/stream/arrival-excel-data',
    roles: permitAdminArrivals('Stream'),
    element: ArrivalsPaymentData,
    placeholder: false,
  },
]
