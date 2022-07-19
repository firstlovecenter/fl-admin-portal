import MenuButton from 'components/buttons/MenuButton'
import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import {
  BarChartFill,
  Book,
  CashCoin,
  Coin,
  FileEarmarkArrowUpFill,
} from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'
import { ChurchLevel } from 'global-types'
import RoleView from 'auth/RoleView'
import { permitTellerStream } from 'permission-utils'

const Services = () => {
  const { currentUser, theme } = useContext(MemberContext)
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)

  const church = currentUser.currentChurch
  const churchType: ChurchLevel = currentUser.currentChurch?.__typename

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <PlaceholderCustom xs={12} as="h1">
          <div className="text-center">
            <h1 className="mb-0  page-header">{`${church?.name} ${churchType}`}</h1>
            <p className={`${theme} menu-subheading`}>Services</p>
          </div>
        </PlaceholderCustom>
        <div className="d-grid gap-2 mt-5 text-left">
          {churchType === 'Fellowship' &&
            church?.vacationStatus === 'Active' && (
              <MenuButton
                iconComponent={Book}
                title="Fellowship Service"
                color="members"
                onClick={() => navigate(`/services/fellowship`)}
                noCaption
              />
            )}
          {churchType === 'Bacenta' && (
            <MenuButton
              iconComponent={Book}
              title="Bacenta Service"
              color="members"
              onClick={() => navigate(`/services/bacenta`)}
              noCaption
            />
          )}
          {['Constituency', 'Council'].includes(churchType) && (
            <MenuButton
              iconComponent={Book}
              title={`${churchType} Joint Service`}
              color="members"
              noCaption
              onClick={() =>
                navigate(`/${churchType.toLowerCase()}/record-service`)
              }
            />
          )}
          <MenuButton
            iconComponent={BarChartFill}
            title="Trends"
            color="members"
            noCaption
            onClick={() => {
              clickCard(church)
              navigate(`/trends`)
            }}
          />
          {['Council', 'Constituency', 'Fellowship'].includes(churchType) &&
            church.stream_name !== 'anagkazo' && (
              <>
                <MenuButton
                  iconComponent={FileEarmarkArrowUpFill}
                  title="Upload Banking Slips"
                  color="banking"
                  noCaption
                  onClick={() => {
                    clickCard(church)
                    navigate(
                      `/services/${churchType.toLowerCase()}/banking-slips`
                    )
                  }}
                />

                <MenuButton
                  iconComponent={Coin}
                  title="Self Banking Option"
                  color="banking"
                  noCaption
                  onClick={() =>
                    navigate(
                      `/services/${churchType.toLowerCase()}/self-banking`
                    )
                  }
                />
              </>
            )}
          <MenuButton
            iconComponent={CashCoin}
            title="Midweek Banking"
            color="banking"
            onClick={() =>
              navigate(`/services/${churchType.toLowerCase()}/midweek-banking`)
            }
            noCaption
          />
          <RoleView roles={permitTellerStream()}>
            <MenuButton
              iconComponent={CashCoin}
              title="Receive Midweek Offering"
              color="banking"
              onClick={() => navigate(`/anagkazo/receive-banking`)}
              noCaption
            />
          </RoleView>
        </div>
      </Container>
    </div>
  )
}

export default Services
