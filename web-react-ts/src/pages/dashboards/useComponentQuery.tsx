import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import {
  AggregateServiceRecord,
  ChurchLevel,
  Role,
  ServiceRecord,
  VerbTypes,
} from 'global-types'
import { throwToSentry } from 'global-utils'
import {
  AggregateBussingRecords,
  BussingRecord,
} from 'pages/arrivals/arrivals-types'
import { getHighestRole } from 'pages/directory/update/directory-utils'
import { useState } from 'react'
import { useContext, useEffect } from 'react'
import { parseRoles } from './dashboard-utils'
import {
  SERVANT_BACENTA_LEADER,
  SERVANT_GOVERNORSHIP_LEADER,
  SERVANT_COUNCIL_LEADER,
  SERVANT_STREAM_LEADER,
  SERVANT_CAMPUS_LEADER,
  SERVANT_OVERSIGHT_LEADER,
  SERVANT_GOVERNORSHIP_ADMIN,
  SERVANT_COUNCIL_ADMIN,
  SERVANTS_STREAM_ADMIN,
  SERVANTS_CAMPUS_ADMIN,
  SERVANTS_OVERSIGHT_ADMIN,
  SERVANTS_CAMPUS_ARRIVALS_ADMIN,
  SERVANTS_STREAM_ARRIVALS_ADMIN,
  SERVANTS_COUNCIL_ARRIVALS_ADMIN,
  SERVANTS_GOVERNORSHIP_ARRIVALS_ADMIN,
  SERVANTS_STREAM_ARRIVALS_COUNTER,
  SERVANTS_STREAM_TELLER,
  SERVANTS_HUB_LEADER,
  SERVANTS_MINISTRY_LEADER,
  SERVANTS_CREATIVEARTS_LEADER,
  SERVANTS_MINISTRY_ADMIN,
  SERVANTS_CREATIVEARTS_ADMIN,
  SERVANTS_HUBCOUNCIL_LEADER,
  SERVANT_DENOMINATION_LEADER,
  SERVANTS_DENOMINATION_ADMIN,
} from './userChurchDataQueries'

type DashboardChurchType = {
  __typename: ChurchLevel
  id: string
  name: string
  bussing: BussingRecord[]
  services: ServiceRecord[]
  rehearsals: ServiceRecord[]
  aggregateRehearsalRecords: AggregateServiceRecord[]
  aggregateServiceRecords: AggregateServiceRecord[]
  aggregateBussingRecords: AggregateBussingRecords[]
  aggregateMultiplicationRecords: AggregateServiceRecord[]
  onStageAttendanceRecords: AggregateBussingRecords[]
  aggregateStageAttendanceRecords: AggregateBussingRecords[]
  swellBussingRecords: AggregateBussingRecords[]
}

type UseComponentQuery = {
  servant?: any
  scope?: {
    authRole: Role
    churchId: string
  }
}

const parseAuthRole = (authRole: Role) => {
  const parsedRole = authRole.match(
    /^(leader|admin|arrivalsAdmin|arrivalsCounter|arrivalsPayer|teller)(.+)$/
  )

  if (!parsedRole) return null

  const [, highestVerb, highestLevel] = parsedRole

  return {
    highestVerb: highestVerb as VerbTypes,
    highestLevel: highestLevel as ChurchLevel,
  }
}

const useComponentQuery = (props?: UseComponentQuery) => {
  const { currentUser } = useContext(MemberContext)
  const [assessmentChurch, setAssessmentChurch] =
    useState<DashboardChurchType>()
  const [bacentaLeaderQuery] = useLazyQuery(SERVANT_BACENTA_LEADER)
  const [governorshipLeaderQuery] = useLazyQuery(SERVANT_GOVERNORSHIP_LEADER)
  const [councilLeaderQuery] = useLazyQuery(SERVANT_COUNCIL_LEADER)
  const [streamLeaderQuery] = useLazyQuery(SERVANT_STREAM_LEADER)
  const [campusLeaderQuery] = useLazyQuery(SERVANT_CAMPUS_LEADER)
  const [oversightLeaderQuery] = useLazyQuery(SERVANT_OVERSIGHT_LEADER)
  const [denominationLeaderQuery] = useLazyQuery(SERVANT_DENOMINATION_LEADER)
  //Admin Queries
  const [governorshipAdminQuery] = useLazyQuery(SERVANT_GOVERNORSHIP_ADMIN)
  const [councilAdminQuery] = useLazyQuery(SERVANT_COUNCIL_ADMIN)
  const [streamAdminQuery] = useLazyQuery(SERVANTS_STREAM_ADMIN)
  const [campusAdminQuery] = useLazyQuery(SERVANTS_CAMPUS_ADMIN)
  const [oversightAdminQuery] = useLazyQuery(SERVANTS_OVERSIGHT_ADMIN)
  const [denominationAdminQuery] = useLazyQuery(SERVANTS_DENOMINATION_ADMIN)
  //Arrivals Admin Queries
  const [governorshipArrivalsAdminQuery] = useLazyQuery(
    SERVANTS_GOVERNORSHIP_ARRIVALS_ADMIN
  )
  const [councilArrivalsAdminQuery] = useLazyQuery(
    SERVANTS_COUNCIL_ARRIVALS_ADMIN
  )
  const [streamArrivalsAdminQuery] = useLazyQuery(
    SERVANTS_STREAM_ARRIVALS_ADMIN
  )
  const [campusArrivalsAdminQuery] = useLazyQuery(
    SERVANTS_CAMPUS_ARRIVALS_ADMIN
  )
  //Arrivals Helpers
  const [streamArrivalsCounterQuery] = useLazyQuery(
    SERVANTS_STREAM_ARRIVALS_COUNTER
  )

  const [streamTellerQuery] = useLazyQuery(SERVANTS_STREAM_TELLER)

  //sonta
  const [hubLeaderQuery] = useLazyQuery(SERVANTS_HUB_LEADER)
  const [hubCouncilLeaderQuery] = useLazyQuery(SERVANTS_HUBCOUNCIL_LEADER)
  const [ministryLeaderQuery] = useLazyQuery(SERVANTS_MINISTRY_LEADER)
  const [creativeArtsLeaderQuery] = useLazyQuery(SERVANTS_CREATIVEARTS_LEADER)
  const [ministryAdminQuery] = useLazyQuery(SERVANTS_MINISTRY_ADMIN)
  const [creativeArtsAdminQuery] = useLazyQuery(SERVANTS_CREATIVEARTS_ADMIN)

  const church: {
    [key: string]: any
  } = {
    Bacenta: {
      leader: bacentaLeaderQuery,
    },
    Governorship: {
      leader: governorshipLeaderQuery,
      admin: governorshipAdminQuery,
      arrivalsAdmin: governorshipArrivalsAdminQuery,
    },
    Council: {
      leader: councilLeaderQuery,
      admin: councilAdminQuery,
      arrivalsAdmin: councilArrivalsAdminQuery,
    },
    Stream: {
      leader: streamLeaderQuery,
      admin: streamAdminQuery,
      arrivalsAdmin: streamArrivalsAdminQuery,
      arrivalsCounter: streamArrivalsCounterQuery,
      teller: streamTellerQuery,
    },
    Campus: {
      leader: campusLeaderQuery,
      admin: campusAdminQuery,
      arrivalsAdmin: campusArrivalsAdminQuery,
    },
    Oversight: {
      leader: oversightLeaderQuery,
      admin: oversightAdminQuery,
      arrivalsAdmin: '',
    },
    Denomination: {
      leader: denominationLeaderQuery,
      admin: denominationAdminQuery,
      arrivalsAdmin: '',
    },

    Hub: {
      leader: hubLeaderQuery,
    },
    HubCouncil: {
      leader: hubCouncilLeaderQuery,
    },
    Ministry: {
      leader: ministryLeaderQuery,
      admin: ministryAdminQuery,
    },
    CreativeArts: {
      leader: creativeArtsLeaderQuery,
      admin: creativeArtsAdminQuery,
    },
  }

  useEffect(() => {
    const fetchAssessmentChurch = async (user: {
      roles: Role[]
      id: string
    }) => {
      if (!user.roles.length) {
        return
      }

      const scopedRole = props?.scope?.authRole
      const scopedChurchId = props?.scope?.churchId
      const parsedScopeRole = scopedRole && parseAuthRole(scopedRole)

      const { highestLevel, highestVerb } =
        parsedScopeRole || getHighestRole(user.roles)

      if (!highestLevel || !highestVerb) {
        return
      }

      const roleQuery = church?.[`${highestLevel}`]?.[`${highestVerb}`]

      if (typeof roleQuery !== 'function') {
        setAssessmentChurch(undefined)
        return
      }

      const response = await roleQuery({
        variables: { id: user.id },
      })

      if (response.error) {
        throwToSentry(response.error)
      }

      const matchingChurches =
        response.data.members?.[0]?.[
          parseRoles(highestVerb || '') + highestLevel
        ] || []

      const selectedChurch = scopedChurchId
        ? matchingChurches.find(
            (church: { id: string }) => church.id === scopedChurchId
          )
        : matchingChurches[0]

      setAssessmentChurch(selectedChurch)

      return
    }

    const targetUser = props?.servant || currentUser

    if (targetUser && targetUser.roles?.length > 0) {
      fetchAssessmentChurch(targetUser)
    }
  }, [
    currentUser,
    props?.scope?.authRole,
    props?.scope?.churchId,
    props?.servant,
    props?.servant?.roles?.length,
  ])

  return { assessmentChurch }
}

export default useComponentQuery
