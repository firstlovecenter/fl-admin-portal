import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { SERVANT_CHURCHES_COUNT } from './DashboardQueries'
import MenuButton from 'components/buttons/MenuButton'
import { useNavigate } from 'react-router'
import { getChurchCount, getMemberCount } from 'global-utils'
import Church from 'assets/icons/Church'
import People from 'assets/icons/People'
import Stars from 'assets/icons/Stars'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'

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
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <PlaceholderCustom loading={!currentUser.fullName} xs={12} as="h1">
          <div className="text-center">
            <h1 className="mb-0 page-header">{`${currentUser.fullName}'s`}</h1>
            <p className={`${theme} menu-subheading`}>Directory</p>
          </div>
        </PlaceholderCustom>

        <div className="d-grid gap-2 mt-5 text-left">
          <MenuButton
            iconComponent={<People />}
            title="members"
            caption={getMemberCount(data?.members[0])}
            color="members"
            onClick={() => navigate(`/directory/members`)}
          />
          <MenuButton
            iconComponent={<Church />}
            title="churches"
            caption={getChurchCount(data?.members[0])}
            color="churches"
            onClick={() => navigate(`/directory/churches`)}
          />
          {hasQuickFacts && (
            <MenuButton
              iconComponent={<Stars />}
              title="quick facts"
              caption={'Quick facts about your church'}
              color="quick-facts"
              onClick={() =>
                navigate(
                  `/quick-facts/this-month/${selectedScope.churchType.toLowerCase()}`
                )
              }
            />
          )}
        </div>
      </Container>
    </div>
  )
}

export default Directory
