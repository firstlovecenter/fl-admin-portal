import { useQuery } from '@apollo/client'
import MembersGrid from 'components/members-grids/MembersGrid'
import { DownloadableLevel } from 'components/members-grids/DownloadMembershipModal'
import { MemberContext } from 'contexts/MemberContext'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import React, { useContext } from 'react'
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

  const { data, loading, error } = useQuery(GET_SERVANT_MEMBERS, {
    variables: { id: currentUser.id },
  })

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
      : undefined

  return (
    <MembersGrid
      title={data ? `${data?.members[0]?.fullName} Membership` : null}
      data={data?.members[0]?.members}
      loading={loading}
      error={error}
      downloadConfig={downloadConfig}
    />
  )
}

export default ServantMembers
