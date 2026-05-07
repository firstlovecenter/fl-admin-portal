import React, { useContext } from 'react'
import MembersGrid from 'components/members-grids/MembersGrid'
import { MemberContext } from 'contexts/MemberContext'
import { GET_SERVANT_MEMBERS } from './GridQueries'

const ServantMembers = () => {
  const { currentUser } = useContext(MemberContext)

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
    />
  )
}

export default ServantMembers
