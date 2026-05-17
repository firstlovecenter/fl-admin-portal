import React from 'react'
import { DocumentNode } from '@apollo/client'
import MembersGrid from 'components/members-grids/MembersGrid'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import {
  GET_BACENTA_MEMBERS,
  GET_CAMPUS_MEMBERS,
  GET_COUNCIL_MEMBERS,
  GET_DENOMINATION_MEMBERS,
  GET_GOVERNORSHIP_MEMBERS,
  GET_OVERSIGHT_MEMBERS,
  GET_STREAM_MEMBERS,
} from './GridQueries'

type SupportedChurchType =
  | 'Denomination'
  | 'Oversight'
  | 'Campus'
  | 'Stream'
  | 'Council'
  | 'Governorship'
  | 'Bacenta'

type LevelConfig = {
  query: DocumentNode
  pluckKey: string
  parentTypename: SupportedChurchType
}

const LEVEL_CONFIGS: Record<SupportedChurchType, LevelConfig> = {
  Denomination: {
    query: GET_DENOMINATION_MEMBERS,
    pluckKey: 'denominations',
    parentTypename: 'Denomination',
  },
  Oversight: {
    query: GET_OVERSIGHT_MEMBERS,
    pluckKey: 'oversights',
    parentTypename: 'Oversight',
  },
  Campus: {
    query: GET_CAMPUS_MEMBERS,
    pluckKey: 'campuses',
    parentTypename: 'Campus',
  },
  Stream: {
    query: GET_STREAM_MEMBERS,
    pluckKey: 'streams',
    parentTypename: 'Stream',
  },
  Council: {
    query: GET_COUNCIL_MEMBERS,
    pluckKey: 'councils',
    parentTypename: 'Council',
  },
  Governorship: {
    query: GET_GOVERNORSHIP_MEMBERS,
    pluckKey: 'governorships',
    parentTypename: 'Governorship',
  },
  Bacenta: {
    query: GET_BACENTA_MEMBERS,
    pluckKey: 'bacentas',
    parentTypename: 'Bacenta',
  },
}

const ChurchLevelMembers = () => {
  const { selectedScope } = useChurchRoleScope()

  if (!selectedScope) return <></>

  const config = LEVEL_CONFIGS[selectedScope.churchType as SupportedChurchType]

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh gap-2 text-muted-foreground">
        <p className="text-sm">
          Member browsing is not available at the{' '}
          <span className="font-medium">{selectedScope.churchType}</span> level.
        </p>
      </div>
    )
  }

  return (
    <MembersGrid
      query={config.query}
      parentId={selectedScope.churchId}
      parentTypename={config.parentTypename}
      pluckParent={(data) => data?.[config.pluckKey]?.[0]}
      getHeading={(parent) =>
        parent ? (
          <>
            {parent.name}{' '}
            <span className="text-members">Members</span>
          </>
        ) : null
      }
    />
  )
}

export default ChurchLevelMembers
