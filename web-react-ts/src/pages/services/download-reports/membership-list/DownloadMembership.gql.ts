// Queries moved to components/members-grids/download-membership.gql.ts so the
// in-grid Download Membership modal does not depend on a page module. This
// file re-exports them for the legacy `/download-reports/<level>/membership`
// pages (still wired up via TrendsMenu) until those routes are retired.
export {
  DISPLAY_FELLOWSHIP_MEMBERSHIP,
  DISPLAY_BACENTA_MEMBERSHIP,
  DISPLAY_GOVERNORSHIP_MEMBERSHIP,
  DISPLAY_COUNCIL_MEMBERSHIP,
  DISPLAY_STREAM_MEMBERSHIP,
  DISPLAY_CAMPUS_MEMBERSHIP,
  DISPLAY_OVERSIGHT_MEMBERSHIP,
} from 'components/members-grids/download-membership.gql'
