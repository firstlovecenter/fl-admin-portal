import { LazyRouteTypes } from 'global-types'
import { permitLeaderAdminArrivals, permitMe } from 'permission-utils'
import { lazy } from 'react'

const Maps = lazy(() => import('pages/maps/Maps'))
const ViewMaps = lazy(() => import('pages/maps/fellowship/ViewMaps'))
const IndoorOutreachVenues = lazy(
  () => import('pages/maps/venues/indoors/IndoorOutreachVenues')
)
const AddIndoorVenue = lazy(
  () => import('pages/maps/venues/indoors/AddIndoorOutreachVenue')
)
const OutdoorOutreachVenues = lazy(
  () => import('pages/maps/venues/outdoors/OutdoorOutreachVenues')
)
const AddOutdoorVenue = lazy(
  () => import('pages/maps/venues/outdoors/AddOutdoorOutreachVenue')
)
const AddHostelInformation = lazy(
  () => import('pages/maps/venues/hostels/AddHostelInformation')
)
const HostelInformation = lazy(
  () => import('pages/maps/venues/hostels/HostelInformation')
)
const AddSeniorHighSchool = lazy(
  () => import('pages/maps/venues/high-schools/AddSeniorHighSchool')
)
const SeniorHighSchools = lazy(
  () => import('pages/maps/venues/high-schools/SeniorHighSchools')
)

export const maps: LazyRouteTypes[] = [
  {
    path: '/maps',
    element: Maps,
    placeholder: true,
    roles: ['all'],
  },
  {
    path: '/maps/view-maps',
    element: ViewMaps,
    placeholder: false,
    roles: [...permitMe('Bacenta'), ...permitMe('Hub')],
  },
  {
    path: '/maps/indoor-outreach-venues',
    element: IndoorOutreachVenues,
    placeholder: false,
    roles: permitLeaderAdminArrivals('Bacenta'),
  },
  {
    path: '/maps/indoor-outreach-venues/add',
    element: AddIndoorVenue,
    placeholder: false,
    roles: permitLeaderAdminArrivals('Bacenta'),
  },
  {
    path: '/maps/outdoor-outreach-venues',
    element: OutdoorOutreachVenues,
    placeholder: false,
    roles: permitLeaderAdminArrivals('Bacenta'),
  },
  {
    path: '/maps/outdoor-outreach-venues/add',
    element: AddOutdoorVenue,
    placeholder: false,
    roles: permitLeaderAdminArrivals('Bacenta'),
  },
  {
    path: '/maps/hostel-information/add',
    element: AddHostelInformation,
    placeholder: false,
    roles: permitLeaderAdminArrivals('Bacenta'),
  },
  {
    path: '/maps/hostel-information',
    element: HostelInformation,
    placeholder: false,
    roles: permitLeaderAdminArrivals('Bacenta'),
  },
  {
    path: '/maps/senior-high-schools',
    element: SeniorHighSchools,
    placeholder: false,
    roles: permitLeaderAdminArrivals('Bacenta'),
  },
  {
    path: '/maps/senior-high-schools/add',
    element: AddSeniorHighSchool,
    placeholder: false,
    roles: permitLeaderAdminArrivals('Bacenta'),
  },
]
