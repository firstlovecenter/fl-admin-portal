// Membership-download routes by church level. Shared between the Reports
// page (entry card) and the MembersGrid (in-page download button).
export const MEMBERSHIP_DOWNLOAD_PATHS = {
  Bacenta: '/download-reports/bacenta/membership',
  Governorship: '/download-reports/governorship/membership',
  Council: '/download-reports/council/membership',
  Stream: '/download-reports/stream/membership',
  Campus: '/download-reports/campus/membership',
  Oversight: '/download-reports/oversight/membership',
} as const

export type MembershipDownloadLevel = keyof typeof MEMBERSHIP_DOWNLOAD_PATHS

export const getMembershipDownloadPath = (
  churchType: string | undefined
): string | null => {
  if (!churchType) return null
  return (
    MEMBERSHIP_DOWNLOAD_PATHS[churchType as MembershipDownloadLevel] ?? null
  )
}
