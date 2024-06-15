import { useContext } from 'react'
import { Button } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { ChurchContext } from '../contexts/ChurchContext'
import { capitalise } from '../global-utils'
import PlaceholderCustom from './Placeholder'
import './MemberRoleList.css'
import { ChurchLevelLower, MemberWithChurches } from 'global-types'

interface MemberForRoles extends MemberWithChurches {
  [key: string]: any
}

const roleTypes = [
  'Bacenta',
  'Constituency',
  'Council',
  'Stream',
  'Campus',
  'CreativeArts',
  'Ministry',
  'Hub',
  'HubCouncil',
]

const adminTypes = [
  'Constituency',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
  'CreativeArts',
  'Ministry',
]

const updateRank = (
  member: MemberForRoles,
  churchType: ChurchLevelLower,
  rank: any
) => {
  member[`isAdminFor${capitalise(churchType)}`]?.map((church: any) => {
    let ch: ChurchLevelLower = church.__typename.toLowerCase()
    rank[`${ch}Admin`].push({
      name: church.name,
      stream_name: church.stream_name,
      bacenta: church.bacenta,
      hub: church.hub,
      constituency: church.constituency,
      id: church.id,
      admin: true,
      link: '',
      __typename: church.__typename,
    })
    return null
  })

  member[`leads${capitalise(churchType)}`]?.map((church: any) => {
    let ch: ChurchLevelLower = church.__typename.toLowerCase()
    rank[`${ch}Leader`].push({
      name: church.name,
      stream_name: church.stream_name,
      bacenta: church.bacenta,
      hub: church.hub,
      constituency: church.constituency,
      id: church.id,
      link: '',
      __typename: church.__typename,
    })
    return null
  })

  return rank
}

export const getRank = (
  memberLeader: MemberForRoles,
  memberAdmin: MemberForRoles
) => {
  let rank = roleTypes.reduce((acc, role) => {
    acc[`${role.toLowerCase()}Leader`] = []
    acc[`${role.toLowerCase()}Admin`] = []
    return acc
  }, {} as any)

  roleTypes.forEach((role) => {
    if (roleTypes.includes(role) && memberLeader[`leads${role}`][0]) {
      rank = updateRank(
        memberLeader,
        role.toLowerCase() as ChurchLevelLower,
        rank
      )
    }
    if (adminTypes.includes(role) && memberAdmin[`isAdminFor${role}`][0]) {
      rank = updateRank(
        memberAdmin,
        role.toLowerCase() as ChurchLevelLower,
        rank
      )
    }
  })

  return rank
}

const MemberRoleList = ({
  memberLeader,
  memberAdmin,
}: {
  memberLeader: MemberForRoles
  memberAdmin: MemberForRoles
}) => {
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  if (!memberLeader || !memberAdmin) {
    return null
  }

  const rank = getRank(memberLeader, memberAdmin)

  return (
    <PlaceholderCustom>
      <small className="mb-5">
        <Button
          onClick={() => navigate('/dashboard/servants')}
          variant="brand"
          className="mb-3 px-5"
        >
          View Graphs
        </Button>

        {
          //Rank Discussions */}
          Object.entries(rank).map((rank: any) => {
            return rank[1].map(
              (
                place: {
                  name: string
                  __typename: string
                  admin: boolean
                  link: string
                },
                i: number
              ) => {
                let servant = 'Leader'

                if (place.admin) {
                  servant = 'Admin'
                }

                return (
                  <span
                    key={i}
                    onClick={() => {
                      clickCard(place)
                      navigate(place.link)
                    }}
                  >
                    <p className="mb-0">
                      <span className=" text-secondary">{`${place.__typename} ${servant} : `}</span>
                      <span>{place.name}</span>
                    </p>
                  </span>
                )
              }
            )
          })
        }
      </small>
    </PlaceholderCustom>
  )
}

export default MemberRoleList
