import React, { useContext } from 'react'
import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import MenuButton from 'components/buttons/MenuButton'
import Stars from 'assets/icons/Stars'
import Charts from 'assets/icons/Charts'
import PieChart from 'assets/icons/PieChart'
import { Download } from 'react-bootstrap-icons'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin } from 'permission-utils'

const TrendsMenu = () => {
  const { currentUser, theme } = useContext(MemberContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <PlaceholderCustom xs={12} as="h1">
          <div className="text-center">
            <h1 className="mb-0  page-header">{`${church?.name} ${churchType}`}</h1>
            <p className={`${theme} menu-subheading`}>Trends Page</p>
          </div>
        </PlaceholderCustom>
        <div className="d-grid gap-2 mt-5 text-left">
          <MenuButton
            iconComponent={<Charts />}
            title="Last 4 Weeks"
            color="members"
            onClick={() => navigate(`/${churchType.toLowerCase()}/graphs`)}
            caption={'Income and Attendance Graphs'}
          />
          <MenuButton
            iconComponent={<Stars />}
            title="Quick Facts"
            color="quick-facts"
            onClick={() =>
              navigate(
                `/quick-facts/this-month/${church.__typename.toLowerCase()}`
              )
            }
            caption={'Quick facts about your church'}
          />
          {['Council'].includes(churchType) && (
            <RoleView roles={permitLeaderAdmin('Council')}>
              <MenuButton
                title="Download Reports"
                color="green"
                iconComponent={<Download />}
                onClick={() =>
                  navigate(
                    `/download-reports/${church.__typename.toLowerCase()}`
                  )
                }
                caption={'Download reports of your church'}
              />
            </RoleView>
          )}
          <MenuButton
            iconComponent={<PieChart />}
            title="Member Conversion Chart"
            color="multiplication"
            onClick={() =>
              navigate(
                `/campaigns/${church.__typename.toLowerCase()}/multiplication/member-conversion-chart`
              )
            }
            caption={'Member conversion chart of your church'}
          />
        </div>
      </Container>
    </div>
  )
}
export default TrendsMenu
