import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import MenuButton from 'components/buttons/MenuButton'
import { useNavigate } from 'react-router'
import { getMemberCount } from 'global-utils'
import People from 'assets/icons/People'
import Stars from 'assets/icons/Stars'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { SERVANT_CHURCHES_COUNT } from './DashboardQueries'

const QUICK_FACTS_LEVELS = new Set([
  'Bacenta',
  'Governorship',
  'Stream',
  'Council',
  'Campus',
])

const Directory = () => {
  const { currentUser, theme } = useContext(MemberContext)
  const { data } = useQuery(SERVANT_CHURCHES_COUNT, {
    variables: { id: currentUser.id },
  })
  const navigate = useNavigate()
  const { selectedScope } = useChurchRoleScope()

  const hasQuickFacts =
    !!selectedScope && QUICK_FACTS_LEVELS.has(selectedScope.churchType)

  return (
    <div className="flex items-center justify-center">
      <div className="mx-auto w-full max-w-screen-md px-4">
        <PlaceholderCustom loading={!currentUser.fullName} xs={12} as="h1">
          <div className="text-center">
            <h1 className="page-header mb-0">{`${currentUser.fullName}'s`}</h1>
            <p className={`${theme} menu-subheading`}>Directory</p>
          </div>
        </PlaceholderCustom>

        <div className="mt-5 grid gap-2 text-left">
          <MenuButton
            iconComponent={<People />}
            title="members"
            caption={getMemberCount(data?.members[0])}
            color="members"
            onClick={() => navigate(`/directory/members`)}
          />
          {hasQuickFacts && (
            <MenuButton
              iconComponent={<Stars />}
              title="quick facts"
              caption="Quick facts about your church"
              color="quick-facts"
              onClick={() =>
                navigate(
                  `/quick-facts/this-month/${selectedScope.churchType.toLowerCase()}`
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Directory
