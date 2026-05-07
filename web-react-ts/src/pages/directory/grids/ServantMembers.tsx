import React, { useContext } from 'react'
import MembersGrid from 'components/members-grids/MembersGrid'
import { DownloadableLevel } from 'components/members-grids/DownloadMembershipModal'
import { MemberContext } from 'contexts/MemberContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { GET_SERVANT_MEMBERS } from './GridQueries'

// Only the church levels that have a backend `downloadMembership` resolver.
// Hub / HubCouncil / Ministry / CreativeArts have no resolver and are skipped.
const DOWNLOADABLE_TYPES = new Set<string>([
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
])

const ServantMembers = () => {
  const { currentUser } = useContext(MemberContext)
  const { selectedScope } = useChurchRoleScope()

  // Match TrendsMenu: prefer the role-scoped focus church, fall back to
  // currentUser.currentChurch. The download modal needs an explicit level +
  // id so it can fire the right `DISPLAY_<LEVEL>_MEMBERSHIP` query.
  const focusChurchType =
    selectedScope?.churchType ?? currentUser?.currentChurch?.__typename
  const focusChurchId =
    selectedScope?.churchId ?? currentUser?.currentChurch?.id
  const focusChurchName =
    selectedScope?.churchName ?? currentUser?.currentChurch?.name

  const downloadConfig =
    focusChurchType &&
    focusChurchId &&
    DOWNLOADABLE_TYPES.has(focusChurchType)
      ? {
          level: focusChurchType as DownloadableLevel,
          churchId: focusChurchId,
          churchName: focusChurchName,
        }
      : null

  return (
    <MembersGrid
      query={GET_SERVANT_MEMBERS}
      parentId={currentUser?.id}
      parentTypename="Member"
      pluckParent={(data) => data?.members?.[0]}
      getHeading={(parent) =>
        parent ? (
          <>
            {parent.fullName}{' '}
            <span className="text-members">Members</span>
          </>
        ) : null
      }
      downloadConfig={downloadConfig}
    />
  )
}

export default ServantMembers
