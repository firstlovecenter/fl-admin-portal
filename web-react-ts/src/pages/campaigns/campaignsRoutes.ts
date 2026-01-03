import {
  permitLeader,
  permitLeaderAdmin,
  permitSheepSeeker,
} from 'permission-utils'
import { LazyRouteTypes } from 'global-types'
import { lazy } from 'react'

const CampusEquipmentHaveNotFilledByFellowship = lazy(
  () => import('./equipment/campus/CampusEquipmentHaveNotFilledByFellowship')
)
const CampusEquipmentHaveNotFilledByGovernorship = lazy(
  () => import('./equipment/campus/CampusEquipmentHaveNotFilledByGovernorship')
)

const StreamEquipmentHaveNotFilledByFellowship = lazy(
  () => import('./equipment/stream/StreamEquipmentHaveNotFilledByFellowship')
)

const StreamEquipmentHaveNotFilledByGovernorship = lazy(
  () => import('./equipment/stream/StreamEquipmentHaveNotFilledByGovernorship')
)

const GovernorshipEquipmentCampaign = lazy(
  () =>
    import(
      'pages/campaigns/equipment/governorship/GovernorshipEquipmentCampaign'
    )
)
const GovernorshipEquipmentForm = lazy(
  () =>
    import('pages/campaigns/equipment/governorship/GovernorshipEquipmentForm')
)
const CampaignChurchList = lazy(() => import('pages/campaigns/ChurchList'))
const GovernorshipEquipmentTrends = lazy(
  () => import('pages/campaigns/equipment/governorship/GovernorshipTrends')
)
const GovernorshipCampaigns = lazy(
  () => import('pages/campaigns/GovernorshipCampaigns')
)
const FellowshipEquipmentCampaign = lazy(
  () =>
    import('pages/campaigns/equipment/fellowship/FellowshipEquipmentCampaign')
)
const FellowshipMultiplicationCampaign = lazy(
  () => import('./multiplication/fellowship/FellowshipMultiplicationCampaign')
)
const BacentaMultiplicationCampaign = lazy(
  () => import('./multiplication/bacenta/BacentaMultiplicationCampaign')
)
const FellowshipEquipmentForm = lazy(
  () => import('pages/campaigns/equipment/fellowship/FellowshipEquipmentForm')
)
const FellowshipCampaigns = lazy(
  () => import('pages/campaigns/FellowshipCampaigns')
)
const GovernorshipEquipmentFormDetails = lazy(
  () =>
    import(
      'pages/campaigns/equipment/governorship/GovernorshipEquipmentFormDetails'
    )
)
const FellowshipEquipmentFormDetails = lazy(
  () =>
    import(
      'pages/campaigns/equipment/fellowship/FellowshipEquipmentFormDetails'
    )
)
const FellowshipTrends = lazy(
  () => import('./equipment/fellowship/FellowshipTrends')
)
const CampusCampaigns = lazy(() => import('./CampusCampaigns'))
const StreamCampaigns = lazy(() => import('./StreamCampaigns'))
const CouncilCampaigns = lazy(() => import('./CouncilCampaigns'))
const BacentaCampaigns = lazy(() => import('./BacentaCampaigns'))
const StreamEquipmentCampaign = lazy(
  () => import('./equipment/stream/StreamEquipmentCampaign')
)
const CouncilEquipmentCampaign = lazy(
  () => import('./equipment/council/CouncilEquipmentCampaign')
)
const BacentaEquipmentCampaign = lazy(
  () => import('./equipment/bacenta/BacentaEquipmentCampaign')
)
const CampusTrends = lazy(() => import('./equipment/campus/CampusTrends'))
const StreamTrends = lazy(() => import('./equipment/stream/StreamTrends'))
const CouncilTrends = lazy(() => import('./equipment/council/CouncilTrends'))
const BacentaTrends = lazy(() => import('./equipment/bacenta/BacentaTrends'))
const CampusByStream = lazy(() => import('./equipment/campus/CampusByStream'))
const StreamByCouncil = lazy(() => import('./equipment/stream/StreamByCouncil'))
const CouncilByGovernorship = lazy(
  () => import('./equipment/council/CouncilByGovernorship')
)
const GovernorshipByBacenta = lazy(
  () => import('./equipment/governorship/GovernorshipByBacenta')
)
const BacentaByFellowship = lazy(
  () => import('./equipment/bacenta/BacentaByFellowship')
)
const CampusEquipmentDeadline = lazy(
  () => import('./equipment/campus/CampusEquipmentDeadline')
)
const CampusEquipmentCampaign = lazy(
  () => import('./equipment/campus/CampusEquipmentCampaign')
)
const CampusAntiBrutishCampaign = lazy(
  () => import('./anti-brutish/campus/CampusAntiBrutishCampaign')
)
const CampusMultiplicationCampaign = lazy(
  () => import('./multiplication/campus/CampusMultiplicationCampaign')
)
const CampusMemberConversionChart = lazy(
  () => import('./multiplication/campus/CampusMemberConversionChart')
)
const StreamMemberConversionChart = lazy(
  () => import('./multiplication/stream/StreamMemberConversionChart')
)
const CouncilMemberConversionChart = lazy(
  () => import('./multiplication/council/CouncilMemberConversionChart')
)
const GovernorshipMemberConversionChart = lazy(
  () =>
    import('./multiplication/governorship/GovernorshipMemberConversionChart')
)
const BacentaMemberConversionChart = lazy(
  () => import('./multiplication/bacenta/BacentaMemberConversionChart')
)
const FellowshipMemberConversionChart = lazy(
  () => import('./multiplication/fellowship/FellowshipMemberConversionChart')
)

const CampusSwollenSundayCampaign = lazy(
  () => import('./swollen-sunday/campus/CampusSwollenSundayCampaign')
)
const CampusTelepastoringCampaign = lazy(
  () => import('./telepastoring/campus/CampusTelepastoringCampaign')
)
const StreamAntiBrutishCampaign = lazy(
  () => import('./anti-brutish/stream/StreamAntiBrutishCampaign')
)
const StreamMultiplicationCampaign = lazy(
  () => import('./multiplication/stream/StreamMultiplicationCampaign')
)
const StreamSwollenSundayCampaign = lazy(
  () => import('./swollen-sunday/stream/StreamSwollenSundayCampaign')
)
const StreamTelepastoringCampaign = lazy(
  () => import('./telepastoring/stream/StreamTelepastoringCampaign')
)
const CouncilAntiBrutishCampaign = lazy(
  () => import('./anti-brutish/council/CouncilAntiBrutishCampaign')
)
const CouncilMultiplicationCampaign = lazy(
  () => import('./multiplication/council/CouncilMultiplicationCampaign')
)
const CouncilTelepastoringCampaign = lazy(
  () => import('./telepastoring/council/CouncilTelepastoringCampaign')
)
const CouncilSwollenSundayCampaign = lazy(
  () => import('./swollen-sunday/council/CouncilSwollenSundayCampaign')
)
const BacentaSwollenSundayCampaign = lazy(
  () => import('./swollen-sunday/bacenta/BacentaSwollenSundayCampaign')
)
const GovernorshipAntiBrutishCampaign = lazy(
  () => import('./anti-brutish/governorship/GovernorshipAntiBrutishCampaign')
)
const GovernorshipMultiplicationCampaign = lazy(
  () =>
    import('./multiplication/governorship/GovernorshipMultiplicationCampaign')
)
const GovernorshipSwollenSundayCampaign = lazy(
  () =>
    import('./swollen-sunday/governorship/GovernorshipSwollenSundayCampaign')
)
const GovernorshipTelepastoringCampaign = lazy(
  () => import('./telepastoring/governorship/GovernorshipTelepastoringCampaign')
)
const GovernorshipEquipmentDefaulters = lazy(
  () => import('./equipment/governorship/GovernorshipEquipmentDefaulters')
)
const GovernorshipEquipmentHaveNotFilledByFellowship = lazy(
  () =>
    import(
      './equipment/governorship/GovernorshipEquipmentHaveNotFilledByFellowship'
    )
)
const CouncilEquipmentDefaulters = lazy(
  () => import('./equipment/council/CouncilEquipmentDefaulters')
)
const CouncilEquipmentHaveNotFilledByFellowship = lazy(
  () => import('./equipment/council/CouncilEquipmentHaveNotFilledByFellowship')
)
const CouncilEquipmentHaveNotFilledByGovernorship = lazy(
  () =>
    import('./equipment/council/CouncilEquipmentHaveNotFilledByGovernorship')
)
const CampusEquipmentDefaulters = lazy(
  () => import('./equipment/campus/CampusEquipmentDefaulters')
)
const CampusByStreamEquipmentDefaulters = lazy(
  () => import('./equipment/campus/CampusByStreamEquipmentDefaulters')
)
const StreamByCouncilEquipmentDefaulters = lazy(
  () => import('./equipment/stream/StreamByCouncilEquipmentDefaulters')
)
const CouncilByGovernorshipEquipmentDefaulters = lazy(
  () => import('./equipment/council/CouncilByGovernorshipEquipmentDefaulters')
)
const StreamEquipmentDefaulters = lazy(
  () => import('./equipment/stream/StreamEquipmentDefaulters')
)

const SheepSeekerSelect = lazy(
  () => import('../campaigns/sheep-seeking/stream/SheepSeekerSelect')
)

const StreamSheepSeekerCampaign = lazy(
  () => import('../campaigns/sheep-seeking/stream/StreamSheepSeekerCampaign')
)

const CampusSheepSeekerCampaign = lazy(
  () => import('../campaigns/sheep-seeking/campus/CampusSheepSeekerCampaign')
)

const CampusMultiplicationCampaignServiceForm = lazy(
  () =>
    import('./multiplication/campus/CampusMultiplicationCampaignServiceForm')
)

const StreamMultiplicationCampaignServiceForm = lazy(
  () =>
    import(
      '../campaigns/multiplication/stream/StreamMultiplicationCampaignServiceForm'
    )
)

const CouncilMultiplicationCampaignServiceForm = lazy(
  () =>
    import(
      '../campaigns/multiplication/council/CouncilMultiplicationCampaignServiceForm'
    )
)

const GovernorshipMultiplicationCampaignServiceForm = lazy(
  () =>
    import(
      '../campaigns/multiplication/governorship/GovernorshipMultiplicationCampaignServiceForm'
    )
)
const GovernorshipMultiplicationCampaignServiceDetails = lazy(
  () =>
    import(
      '../campaigns/multiplication/governorship/GovernorshipMultiplicationCampaignServiceDetails'
    )
)

const CouncilMultiplicationCampaignServiceDetails = lazy(
  () =>
    import(
      '../campaigns/multiplication/council/CouncilMultiplicationCampaignServiceDetails'
    )
)

const CampusMultiplicationCampaignServiceDetails = lazy(
  () =>
    import('./multiplication/campus/CampusMultiplicationCampaignServiceDetails')
)

const StreamMultiplicationCampaignServiceDetails = lazy(
  () =>
    import(
      '../campaigns/multiplication/stream/StreamMultiplicationCampaignServiceDetails'
    )
)

const CampusSwollenSundayTrends = lazy(
  () => import('../campaigns/swollen-sunday/campus/CampusSwollenSundayTrends')
)

const CampusSwollenSundayStreamList = lazy(
  () =>
    import('../campaigns/swollen-sunday/campus/CampusSwollenSundayStreamList')
)

const StreamSwollenSundayTrends = lazy(
  () => import('../campaigns/swollen-sunday/stream/StreamSwollenSundayTrends')
)

const CouncilSwollenSundayTrends = lazy(
  () => import('../campaigns/swollen-sunday/council/CouncilSwollenSundayTrends')
)

const GovernorshipSwollenSundayTrends = lazy(
  () =>
    import(
      '../campaigns/swollen-sunday/governorship/GovernorshipSwollenSundayTrends'
    )
)

const BacentaSwollenSundayTrends = lazy(
  () => import('../campaigns/swollen-sunday/bacenta/BacentaSwollenSundayTrends')
)

const CouncilSwollenSundayUploadTargets = lazy(
  () =>
    import(
      '../campaigns/swollen-sunday/council/CouncilSwollenSundayUploadTargets'
    )
)

const StreamSwollenSundayUploadTargets = lazy(
  () =>
    import(
      '../campaigns/swollen-sunday/stream/StreamSwollenSundayUploadTargets'
    )
)

const CouncilSwollenSundayTarget = lazy(
  () => import('../campaigns/swollen-sunday/council/CouncilSwollenSundayTarget')
)

const StreamSwollenSundayTarget = lazy(
  () => import('../campaigns/swollen-sunday/stream/StreamSwollenSundayTarget')
)

const StreamSwollenSundayShareTargetByCouncil = lazy(
  () =>
    import(
      '../campaigns/swollen-sunday/stream/StreamSwollenSundayShareTargetByCouncil'
    )
)

const SwollenSundayStreamList = lazy(
  () => import('./swollen-sunday/stream/SwollenSundayStreamList')
)
const SwollenSundayCouncilList = lazy(
  () => import('./swollen-sunday/council/SwollenSundayCouncilList')
)
const SwollenSundayGovernorshipList = lazy(
  () => import('./swollen-sunday/governorship/SwollenSundayGovernorshipList')
)
const SwollenSundayBacentaList = lazy(
  () => import('./swollen-sunday/bacenta/SwollenSundayBacentaList')
)

const GovernorshipMultiplicationCampaignTrends = lazy(
  () =>
    import(
      '../campaigns/multiplication/governorship/GovernorshipMultiplicationCampaignTrends'
    )
)

const CouncilMultiplicationCampaignTrends = lazy(
  () =>
    import(
      '../campaigns/multiplication/council/CouncilMultiplicationCampaignTrends'
    )
)

const StreamMultiplicationCampaignTrends = lazy(
  () =>
    import(
      '../campaigns/multiplication/stream/StreamMultiplicationCampaignTrends'
    )
)

const CampusMultiplicationCampaignTrends = lazy(
  () => import('./multiplication/campus/CampusMultiplicationCampaignTrends')
)

const GovernorshipMultiplicationCampaignUploadReceipts = lazy(
  () =>
    import(
      '../campaigns/multiplication/governorship/GovernorshipMultiplicationCampaignUploadReceipts'
    )
)

const CouncilMultiplicationCampaignUploadReceipts = lazy(
  () =>
    import(
      '../campaigns/multiplication/council/CouncilMultiplicationCampaignUploadReceipts'
    )
)

const CampusMultiplicationCampaignUploadReceipts = lazy(
  () =>
    import('./multiplication/campus/CampusMultiplicationCampaignUploadReceipts')
)

const StreamMultiplicationCampaignUploadReceipts = lazy(
  () =>
    import(
      '../campaigns/multiplication/stream/StreamMultiplicationCampaignUploadReceipts'
    )
)

const GovernorshipMultiplicationCampaignBankingSlipView = lazy(
  () =>
    import(
      '../campaigns/multiplication/governorship/GovernorshipMultiplicationCampaignBankingSlipView'
    )
)
const CouncilMultiplicationCampaignBankingSlipView = lazy(
  () =>
    import(
      '../campaigns/multiplication/council/CouncilMultiplicationCampaignBankingSlipView'
    )
)
const StreamMultiplicationCampaignBankingSlipView = lazy(
  () =>
    import(
      '../campaigns/multiplication/stream/StreamMultiplicationCampaignBankingSlipView'
    )
)
const CampusMultiplicationCampaignBankingSlipView = lazy(
  () =>
    import(
      './multiplication/campus/CampusMultiplicationCampaignBankingSlipView'
    )
)

const BacentaShepherdingControlCampaign = lazy(
  () =>
    import(
      '../campaigns/shepherding-control/bacenta/BacentaShepherdingControlCampaign'
    )
)

const GovernorshipShepherdingControlCampaign = lazy(
  () =>
    import(
      '../campaigns/shepherding-control/governorship/GovernorshipShepherdingControlCampaign'
    )
)
const CouncilShepherdingControlCampaign = lazy(
  () =>
    import(
      '../campaigns/shepherding-control/council/CouncilShepherdingControlCampaign'
    )
)
const StreamShepherdingControlCampaign = lazy(
  () =>
    import(
      '../campaigns/shepherding-control/stream/StreamShepherdingControlCampaign'
    )
)
const CampusShepherdingControlCampaign = lazy(
  () =>
    import(
      '../campaigns/shepherding-control/campus/CampusShepherdingControlCampaign'
    )
)

const BacentaShepherdingControlYearTillDate = lazy(
  () =>
    import(
      '../campaigns/shepherding-control/bacenta/BacentaShepherdingControlYearTillDate'
    )
)

const GovernorshipShepherdingControlYearTillDate = lazy(
  () =>
    import(
      '../campaigns/shepherding-control/governorship/GovernorshipShepherdingControlYearTillDate'
    )
)
const CouncilShepherdingControlYearTillDate = lazy(
  () =>
    import(
      '../campaigns/shepherding-control/council/CouncilShepherdingControlYearTillDate'
    )
)
const StreamShepherdingControlYearTillDate = lazy(
  () =>
    import(
      '../campaigns/shepherding-control/stream/StreamShepherdingControlYearTillDate'
    )
)
const CampusShepherdingControlYearTillDate = lazy(
  () =>
    import(
      '../campaigns/shepherding-control/campus/CampusShepherdingControlYearTillDate'
    )
)

export const campaigns: LazyRouteTypes[] = [
  //campus routes
  {
    path: '/campaigns/campus',
    element: CampusCampaigns,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/equipment',
    element: CampusEquipmentCampaign,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/equipment/trends',
    element: CampusTrends,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/equipment/campus/stream',
    element: CampusByStream,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/set-equipment-deadline',
    element: CampusEquipmentDeadline,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/anti-brutish',
    element: CampusAntiBrutishCampaign,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/multiplication',
    element: CampusMultiplicationCampaign,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/swollen-sunday',
    element: CampusSwollenSundayCampaign,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/telepastoring',
    element: CampusTelepastoringCampaign,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/equipment/defaulters',
    element: CampusEquipmentDefaulters,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/stream/equipment/defaulters',
    element: CampusByStreamEquipmentDefaulters,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/equipment/have-not-filled/fellowship',
    element: CampusEquipmentHaveNotFilledByFellowship,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/equipment/have-not-filled/governorship',
    element: CampusEquipmentHaveNotFilledByGovernorship,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/multiplication/service-form',
    element: CampusMultiplicationCampaignServiceForm,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/multiplication/service-details',
    element: CampusMultiplicationCampaignServiceDetails,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/swollen-sunday/trends',
    element: CampusSwollenSundayTrends,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/swollen-sunday/streams',
    element: CampusSwollenSundayStreamList,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/multiplication/trends',
    element: CampusMultiplicationCampaignTrends,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/multiplication/upload-receipts',
    element: CampusMultiplicationCampaignUploadReceipts,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/multiplication/banking-slips',
    element: CampusMultiplicationCampaignBankingSlipView,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/shepherding-control',
    element: CampusShepherdingControlCampaign,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/shepherding-control/year-to-date',
    element: CampusShepherdingControlYearTillDate,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/sheep-seeking',
    element: CampusSheepSeekerCampaign,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },
  {
    path: '/campaigns/campus/multiplication/member-conversion-chart',
    element: CampusMemberConversionChart,
    roles: permitLeaderAdmin('Campus'),
    placeholder: true,
  },

  //stream routes
  {
    path: '/campaigns/stream',
    element: StreamCampaigns,
    roles: [...permitLeaderAdmin('Stream'), ...permitSheepSeeker()],
    placeholder: true,
  },
  {
    path: '/campaigns/stream/equipment',
    element: StreamEquipmentCampaign,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/equipment/trends',
    element: StreamTrends,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/equipment/stream/council',
    element: StreamByCouncil,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/anti-brutish',
    element: StreamAntiBrutishCampaign,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/multiplication',
    element: StreamMultiplicationCampaign,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/swollen-sunday',
    element: StreamSwollenSundayCampaign,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/telepastoring',
    element: StreamTelepastoringCampaign,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/council/equipment/defaulters',
    element: StreamByCouncilEquipmentDefaulters,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/equipment/defaulters',
    element: StreamEquipmentDefaulters,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/equipment/have-not-filled/fellowship',
    element: StreamEquipmentHaveNotFilledByFellowship,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/equipment/have-not-filled/governorship',
    element: StreamEquipmentHaveNotFilledByGovernorship,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/sheepseeker-select',
    element: SheepSeekerSelect,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/sheep-seeking',
    element: StreamSheepSeekerCampaign,
    roles: ['adminStream', 'adminCampus', 'sheepseekerStream'],
    placeholder: true,
  },
  {
    path: '/campaigns/stream/multiplication/service-form',
    element: StreamMultiplicationCampaignServiceForm,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/multiplication/service-details',
    element: StreamMultiplicationCampaignServiceDetails,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/swollen-sunday/trends',
    element: StreamSwollenSundayTrends,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/swollen-sunday/target',
    element: StreamSwollenSundayTarget,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/swollen-sunday/upload-targets',
    element: StreamSwollenSundayUploadTargets,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/swollen-sunday/share-target-by-council',
    element: StreamSwollenSundayShareTargetByCouncil,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/swollen-sunday/streams',
    element: SwollenSundayStreamList,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/multiplication/trends',
    element: StreamMultiplicationCampaignTrends,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/multiplication/upload-receipts',
    element: StreamMultiplicationCampaignUploadReceipts,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/multiplication/banking-slips',
    element: StreamMultiplicationCampaignBankingSlipView,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/shepherding-control',
    element: StreamShepherdingControlCampaign,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/shepherding-control/year-to-date',
    element: StreamShepherdingControlYearTillDate,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },
  {
    path: '/campaigns/stream/multiplication/member-conversion-chart',
    element: StreamMemberConversionChart,
    roles: permitLeaderAdmin('Stream'),
    placeholder: true,
  },

  //council routes
  {
    path: '/campaigns/council',
    element: CouncilCampaigns,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/equipment',
    element: CouncilEquipmentCampaign,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/equipment/trends',
    element: CouncilTrends,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/equipment/council/governorship',
    element: CouncilByGovernorship,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/anti-brutish',
    element: CouncilAntiBrutishCampaign,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/multiplication',
    element: CouncilMultiplicationCampaign,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/swollen-sunday',
    element: CouncilSwollenSundayCampaign,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/telepastoring',
    element: CouncilTelepastoringCampaign,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/equipment/defaulters',
    element: CouncilEquipmentDefaulters,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/equipment/have-not-filled/fellowship',
    element: CouncilEquipmentHaveNotFilledByFellowship,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/equipment/have-not-filled/governorship',
    element: CouncilEquipmentHaveNotFilledByGovernorship,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/governorship/equipment/defaulters',
    element: CouncilByGovernorshipEquipmentDefaulters,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/multiplication/service-form',
    element: CouncilMultiplicationCampaignServiceForm,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/multiplication/service-details',
    element: CouncilMultiplicationCampaignServiceDetails,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/swollen-sunday/trends',
    element: CouncilSwollenSundayTrends,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/swollen-sunday/target',
    element: CouncilSwollenSundayTarget,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/swollen-sunday/upload-targets',
    element: CouncilSwollenSundayUploadTargets,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/swollen-sunday/councils',
    element: SwollenSundayCouncilList,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/multiplication/trends',
    element: CouncilMultiplicationCampaignTrends,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/multiplication/upload-receipts',
    element: CouncilMultiplicationCampaignUploadReceipts,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/multiplication/banking-slips',
    element: CouncilMultiplicationCampaignBankingSlipView,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/shepherding-control',
    element: CouncilShepherdingControlCampaign,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/shepherding-control/year-to-date',
    element: CouncilShepherdingControlYearTillDate,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },
  {
    path: '/campaigns/council/multiplication/member-conversion-chart',
    element: CouncilMemberConversionChart,
    roles: permitLeaderAdmin('Council'),
    placeholder: true,
  },

  //governorship routes
  {
    path: '/campaigns/governorship',
    element: GovernorshipCampaigns,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/equipment',
    element: GovernorshipEquipmentCampaign,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/equipment/trends',
    element: GovernorshipEquipmentTrends,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/equipment/governorship/bacenta',
    element: GovernorshipByBacenta,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/equipment/form',
    element: GovernorshipEquipmentForm,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/equipment/form-details',
    element: GovernorshipEquipmentFormDetails,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/anti-brutish',
    element: GovernorshipAntiBrutishCampaign,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/multiplication',
    element: GovernorshipMultiplicationCampaign,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/swollen-sunday',
    element: GovernorshipSwollenSundayCampaign,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/telepastoring',
    element: GovernorshipTelepastoringCampaign,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/equipment/defaulters',
    element: GovernorshipEquipmentDefaulters,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/equipment/have-not-filled/fellowship',
    element: GovernorshipEquipmentHaveNotFilledByFellowship,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/multiplication/service-form',
    element: GovernorshipMultiplicationCampaignServiceForm,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/multiplication/service-details',
    element: GovernorshipMultiplicationCampaignServiceDetails,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/swollen-sunday/trends',
    element: GovernorshipSwollenSundayTrends,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/swollen-sunday/governorships',
    element: SwollenSundayGovernorshipList,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/multiplication/trends',
    element: GovernorshipMultiplicationCampaignTrends,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/multiplication/upload-receipts',
    element: GovernorshipMultiplicationCampaignUploadReceipts,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/multiplication/banking-slips',
    element: GovernorshipMultiplicationCampaignBankingSlipView,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/shepherding-control',
    element: GovernorshipShepherdingControlCampaign,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/shepherding-control/year-to-date',
    element: GovernorshipShepherdingControlYearTillDate,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },
  {
    path: '/campaigns/governorship/multiplication/member-conversion-chart',
    element: GovernorshipMemberConversionChart,
    roles: permitLeaderAdmin('Governorship'),
    placeholder: true,
  },

  //bacenta routes
  {
    path: '/campaigns/bacenta',
    element: BacentaCampaigns,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/bacenta/equipment',
    element: BacentaEquipmentCampaign,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/bacenta/equipment/trends',
    element: BacentaTrends,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/equipment/bacenta/fellowship',
    element: BacentaByFellowship,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/bacenta/swollen-sunday',
    element: BacentaSwollenSundayCampaign,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/bacenta/swollen-sunday/trends',
    element: BacentaSwollenSundayTrends,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/bacenta/swollen-sunday/bacentas',
    element: SwollenSundayBacentaList,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/bacenta/shepherding-control',
    element: BacentaShepherdingControlCampaign,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/bacenta/shepherding-control/year-to-date',
    element: BacentaShepherdingControlYearTillDate,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/bacenta/multiplication/member-conversion-chart',
    element: BacentaMemberConversionChart,
    roles: permitLeader('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/bacenta/multiplication',
    element: BacentaMultiplicationCampaign,
    roles: permitLeader('Bacenta'),
    placeholder: true,
  },

  //fellowship routes
  {
    path: '/campaigns/fellowship',
    element: FellowshipCampaigns,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/fellowship/equipment',
    element: FellowshipEquipmentCampaign,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/fellowship/equipment/trends',
    element: FellowshipTrends,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/fellowship/equipment/form',
    element: FellowshipEquipmentForm,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/fellowship/equipment/form-details',
    element: FellowshipEquipmentFormDetails,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/fellowship/multiplication/member-conversion-chart',
    element: FellowshipMemberConversionChart,
    roles: permitLeader('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campaigns/fellowship/multiplication',
    element: FellowshipMultiplicationCampaign,
    roles: permitLeader('Bacenta'),
    placeholder: true,
  },

  //general

  {
    path: '/campaigns/churchlist',
    element: CampaignChurchList,
    roles: ['all'],
    placeholder: true,
  },
]
