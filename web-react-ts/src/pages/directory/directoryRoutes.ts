import { LazyRouteTypes } from 'global-types'
import {
  permitAdmin,
  permitAdminArrivals,
  permitLeaderAdmin,
  permitMe,
} from 'permission-utils'
import { lazy } from 'react'

const UserDisplayPage = lazy(
  () => import('pages/directory/user-profile/DisplayPage')
)
const MemberHistory = lazy(
  () => import('pages/directory/display/church-history/MemberHistory')
)
const StreamHistory = lazy(
  () => import('pages/directory/display/church-history/StreamHistory')
)
const CouncilHistory = lazy(
  () => import('pages/directory/display/church-history/CouncilHistory')
)
const GovernorshipHistory = lazy(
  () => import('pages/directory/display/church-history/GovernorshipHistory')
)
const BacentaHistory = lazy(
  () => import('pages/directory/display/church-history/BacentaHistory')
)

const CampusHistory = lazy(
  () => import('pages/directory/display/church-history/CampusHistory')
)
const DisplayMember = lazy(
  () => import('pages/directory/display/DetailsMember')
)
const UserProfileEditPage = lazy(
  () => import('pages/directory/user-profile/EditPage')
)
const CreateMember = lazy(() => import('pages/directory/create/CreateMember'))
const UpdateMember = lazy(() => import('pages/directory/update/UpdateMember'))
const CouncilMembers = lazy(
  () => import('pages/directory/grids/CouncilMembers')
)
const GovernorshipMembers = lazy(
  () => import('pages/directory/grids/GovernorshipMembers')
)
const BacentaMembers = lazy(
  () => import('pages/directory/grids/BacentaMembers')
)

const DetailsBacenta = lazy(
  () => import('pages/directory/display/DetailsBacenta')
)
const DetailsGovernorship = lazy(
  () => import('pages/directory/display/DetailsGovernorship')
)
const DetailsCouncil = lazy(
  () => import('pages/directory/display/DetailsCouncil')
)
const DetailsStream = lazy(
  () => import('pages/directory/display/DetailsStream')
)
const DisplayAllOversights = lazy(
  () => import('pages/directory/display/AllOversights')
)
const DisplayAllBacentas = lazy(
  () => import('pages/directory/display/AllBacentas')
)
const DisplayAllGovernorships = lazy(
  () => import('pages/directory/display/AllGovernorships')
)
const CouncilBacentas = lazy(
  () => import('pages/directory/display/CouncilBacentas')
)

const CreateGovernorship = lazy(
  () => import('pages/directory/create/CreateGovernorship')
)
const CreateBacenta = lazy(() => import('pages/directory/create/CreateBacenta'))
const UpdateBacenta = lazy(() => import('pages/directory/update/UpdateBacenta'))
const UpdateGovernorship = lazy(
  () => import('pages/directory/update/UpdateGovernorship')
)
const DetailsCampus = lazy(
  () => import('pages/directory/display/DetailsCampus')
)
const DetailsOversight = lazy(
  () => import('pages/directory/display/DetailsOversight')
)
const DetailsDenomination = lazy(
  () => import('pages/directory/display/DetailsDenomination')
)
const DisplayAllCouncils = lazy(
  () => import('pages/directory/display/AllCouncils')
)
const DisplayAllStreams = lazy(
  () => import('pages/directory/display/AllStreams')
)
const DisplayAllCampuses = lazy(
  () => import('pages/directory/display/AllCampuses')
)
const CreateCouncil = lazy(() => import('pages/directory/create/CreateCouncil'))
const AllCampusGovernorships = lazy(
  () => import('pages/directory/display/AllCampusGovernorships')
)
const AllCampusCouncils = lazy(
  () => import('pages/directory/display/AllCampusCouncils')
)
const UpdateCouncil = lazy(() => import('pages/directory/update/UpdateCouncil'))
const CreateStream = lazy(() => import('pages/directory/create/CreateStream'))
const CreateCampus = lazy(() => import('pages/directory/create/CreateCampus'))
const CreateOversight = lazy(
  () => import('pages/directory/create/CreateOversight')
)
const UpdateStream = lazy(() => import('pages/directory/update/UpdateStream'))
const UpdateCampus = lazy(() => import('pages/directory/update/UpdateCampus'))
const UpdateOversight = lazy(
  () => import('pages/directory/update/UpdateOversight')
)
const UpdateDenomination = lazy(
  () => import('pages/directory/update/UpdateDenomination')
)

const CampusMembers = lazy(() => import('pages/directory/grids/CampusMembers'))
const OversightMembers = lazy(
  () => import('pages/directory/grids/OversightMembers')
)
const StreamMembers = lazy(() => import('pages/directory/grids/StreamMembers'))
const ChurchLevelMembers = lazy(
  () => import('pages/directory/grids/ChurchLevelMembers')
)
const AllStreamGovernorships = lazy(
  () => import('pages/directory/display/AllStreamGovernorships')
)
const AllStreamBacentas = lazy(
  () => import('pages/directory/display/AllStreamBacentas')
)

const BacentaAvgWeekdayQuickFacts = lazy(
  () =>
    import('pages/directory/quick-facts/this-month/BacentaAvgWeekdayQuickFacts')
)
const GovernorshipAvgWeekdayQuickFacts = lazy(
  () =>
    import(
      'pages/directory/quick-facts/this-month/GovernorshipAvgWeekdayQuickFacts'
    )
)
const StreamAvgWeekdayQuickFacts = lazy(
  () =>
    import('pages/directory/quick-facts/this-month/StreamAvgWeekdayQuickFacts')
)
const CouncilAvgWeekdayQuickFacts = lazy(
  () =>
    import('pages/directory/quick-facts/this-month/CouncilAvgWeekdayQuickFacts')
)
const CampusAvgWeekdayQuickFacts = lazy(
  () =>
    import('pages/directory/quick-facts/this-month/CampusAvgWeekdayQuickFacts')
)
export const memberDirectory: LazyRouteTypes[] = [
  {
    path: '/directory/members',
    element: ChurchLevelMembers,
    // Member directory is irrelevant to single-purpose roles (e.g. Stream
    // Arrivals Counter) — gate URL access to the same operational set as
    // the rest of the dashboard chrome.
    roles: permitMe('Bacenta'),
  },
]

// Quick-facts attendance pages are leader/admin surfaces — arrivals helpers
// (counter, payer), arrivals admins, and tellers have no business reading
// per-church attendance summaries. Gate at permitLeaderAdmin so MembersDirectoryRoute's
// fallback ladder (also permitLeaderAdmin) consistently rejects helpers.
export const quickFacts: LazyRouteTypes[] = [
  {
    path: '/quick-facts/this-month/bacenta',
    element: BacentaAvgWeekdayQuickFacts,
    roles: permitLeaderAdmin('Bacenta'),
  },
  {
    path: '/quick-facts/this-month/governorship',
    element: GovernorshipAvgWeekdayQuickFacts,
    roles: permitLeaderAdmin('Governorship'),
  },
  {
    path: '/quick-facts/this-month/stream',
    element: StreamAvgWeekdayQuickFacts,
    roles: permitLeaderAdmin('Stream'),
  },
  {
    path: '/quick-facts/this-month/council',
    element: CouncilAvgWeekdayQuickFacts,
    roles: permitLeaderAdmin('Council'),
  },
  {
    path: '/quick-facts/this-month/campus',
    element: CampusAvgWeekdayQuickFacts,
    roles: permitLeaderAdmin('Campus'),
  },
]

// Member-grid routes also gate on permitLeaderAdmin so arrivals helpers
// cannot URL-bypass into a per-level members list (which would otherwise
// match because permitArrivalsHelpers('Stream') folds counter+payer into
// permitMe('Stream')).
export const memberGrids: LazyRouteTypes[] = [
  {
    path: '/oversight/members',
    element: OversightMembers,
    roles: permitLeaderAdmin('Oversight'),
  },
  {
    path: '/campus/members',
    element: CampusMembers,
    roles: permitLeaderAdmin('Campus'),
  },
  {
    path: '/stream/members',
    element: StreamMembers,
    roles: permitLeaderAdmin('Stream'),
  },
  {
    path: '/council/members',
    element: CouncilMembers,
    roles: permitLeaderAdmin('Council'),
  },
  {
    path: '/governorship/members',
    element: GovernorshipMembers,
    roles: permitLeaderAdmin('Governorship'),
  },

  {
    path: '/bacenta/members',
    element: BacentaMembers,
    roles: permitLeaderAdmin('Bacenta'),
  },
]

const Directory = lazy(() => import('pages/dashboards/Directory'))
const Churches = lazy(() => import('pages/directory/Churches'))

export const directory: LazyRouteTypes[] = [
  {
    path: '/directory',
    element: Directory,
    placeholder: true,
    roles: permitMe('Bacenta'),
  },
  {
    path: '/directory/churches',
    element: Churches,
    roles: permitMe('Bacenta'),
  },
  // Member Display and Edit Pages
  // Profile + history pages are operational-leader surfaces; arrivals
  // helpers (counter, payer) should not reach them by URL. Gate at
  // permitMe('Bacenta') to match /ai-assistant, /trends, /directory/members
  // — keeps every leader/admin/arrivals-admin/teller, drops the helpers.
  {
    path: '/user-profile',
    element: UserDisplayPage,
    roles: permitMe('Bacenta'),
    placeholder: true,
  },
  {
    path: '/member/history',
    element: MemberHistory,
    roles: permitMe('Bacenta'),
    placeholder: true,
  },
  {
    path: '/stream/history',
    element: StreamHistory,
    roles: permitMe('Bacenta'),
    placeholder: true,
  },
  {
    path: '/council/history',
    element: CouncilHistory,
    roles: permitMe('Bacenta'),
    placeholder: true,
  },
  {
    path: '/governorship/history',
    element: GovernorshipHistory,
    roles: permitMe('Bacenta'),
    placeholder: true,
  },
  {
    path: '/bacenta/history',
    element: BacentaHistory,
    roles: permitMe('Bacenta'),
    placeholder: true,
  },
  {
    path: '/campus/history',
    element: CampusHistory,
    roles: permitMe('Bacenta'),
    placeholder: true,
  },
  {
    path: '/member/displaydetails',
    element: DisplayMember,
    roles: permitMe('Bacenta'),
    placeholder: true,
  },
  {
    path: '/user-profile/edit',
    element: UserProfileEditPage,
    roles: permitMe('Bacenta'),
    placeholder: true,
  },
  {
    path: '/member/addmember',
    element: CreateMember,
    roles: permitLeaderAdmin('Bacenta'),
    placeholder: true,
  },
  {
    path: '/member/editmember',
    element: UpdateMember,
    roles: [...permitLeaderAdmin('Bacenta')],
    placeholder: true,
  },
  //Display Church Details

  {
    path: '/bacenta/displaydetails',
    element: DetailsBacenta,
    roles: permitMe('Bacenta'),
    placeholder: true,
  },
  {
    path: '/governorship/displaydetails',
    element: DetailsGovernorship,
    roles: permitMe('Governorship'),
    placeholder: true,
  },

  {
    path: '/council/displaydetails',
    element: DetailsCouncil,
    roles: permitMe('Council'),
    placeholder: true,
  },
  {
    path: '/council/bacentas',
    element: CouncilBacentas,
    roles: permitMe('Council'),
    placeholder: true,
  },
  {
    path: '/stream/displaydetails',
    element: DetailsStream,
    roles: permitMe('Stream'),
    placeholder: false,
  },
  {
    path: '/campus/displaydetails',
    element: DetailsCampus,
    roles: permitMe('Campus'),
    placeholder: false,
  },
  {
    path: '/oversight/displaydetails',
    element: DetailsOversight,
    roles: permitMe('Oversight'),
    placeholder: false,
  },
  {
    path: '/denomination/displaydetails',
    element: DetailsDenomination,
    roles: permitMe('Denomination'),
    placeholder: false,
  },
  {
    path: '/campus/governorships',
    element: AllCampusGovernorships,
    roles: permitMe('Campus'),
    placeholder: false,
  },
  {
    path: '/campus/councils',
    element: AllCampusCouncils,
    roles: permitMe('Campus'),
    placeholder: false,
  },
  {
    path: '/stream/governorships',
    element: AllStreamGovernorships,
    roles: permitMe('Stream'),
    placeholder: false,
  },
  {
    path: '/stream/bacentas',
    element: AllStreamBacentas,
    roles: permitMe('Stream'),
    placeholder: false,
  },

  //Display Lists in the Directory
  {
    path: '/bacenta/displayall',
    element: DisplayAllBacentas,
    roles: permitMe('Governorship'),
    placeholder: false,
  },
  {
    path: '/governorship/displayall',
    element: DisplayAllGovernorships,
    roles: permitMe('Council'),
    placeholder: false,
  },

  {
    path: '/council/displayall',
    element: DisplayAllCouncils,
    roles: permitMe('Stream'),
    placeholder: false,
  },
  {
    path: '/stream/displayall',
    element: DisplayAllStreams,
    roles: permitMe('Campus'),
    placeholder: false,
  },
  {
    path: '/campus/displayall',
    element: DisplayAllCampuses,
    roles: permitLeaderAdmin('Oversight'),
    placeholder: false,
  },
  {
    path: '/oversight/displayall',
    element: DisplayAllOversights,
    roles: permitLeaderAdmin('Denomination'),
    placeholder: false,
  },
  //Creation Pages

  {
    path: '/bacenta/addbacenta',
    element: CreateBacenta,
    roles: permitAdminArrivals('Council'),
    placeholder: false,
  },

  {
    path: '/governorship/addgovernorship',
    element: CreateGovernorship,
    roles: permitAdmin('Council'),
    placeholder: false,
  },
  {
    path: '/council/addcouncil',
    element: CreateCouncil,
    roles: permitAdmin('Stream'),
    placeholder: false,
  },
  {
    path: '/stream/addstream',
    element: CreateStream,
    roles: permitAdmin('Campus'),
    placeholder: false,
  },
  {
    path: '/campus/addcampus',
    element: CreateCampus,
    roles: permitAdmin('Oversight'),
    placeholder: false,
  },
  {
    path: '/oversight/addoversight',
    element: CreateOversight,
    roles: permitAdmin('Denomination'),
    placeholder: false,
  },

  //Pages to Update the Directory
  {
    path: '/bacenta/editbacenta',
    element: UpdateBacenta,
    roles: permitMe('Governorship'),
    placeholder: false,
  },
  {
    path: '/governorship/editgovernorship',
    element: UpdateGovernorship,
    roles: permitAdmin('Council'),
    placeholder: false,
  },
  {
    path: '/council/editcouncil',
    element: UpdateCouncil,
    roles: permitAdmin('Stream'),
    placeholder: false,
  },
  {
    path: '/stream/editstream',
    element: UpdateStream,
    roles: permitAdmin('Campus'),
    placeholder: false,
  },
  {
    path: '/campus/editcampus',
    element: UpdateCampus,
    roles: permitAdmin('Oversight'),
    placeholder: false,
  },
  {
    path: '/oversight/editoversight',
    element: UpdateOversight,
    roles: permitAdmin('Oversight'),
    placeholder: false,
  },
  {
    path: '/denomination/editdenomination',
    element: UpdateDenomination,
    roles: permitAdmin('Denomination'),
    placeholder: false,
  },
]
