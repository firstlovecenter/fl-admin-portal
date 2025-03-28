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
  PersonPlus,
  Coin,
  FileEarmarkArrowUpFill,
  EmojiFrown,
} from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'
import { ChurchLevel } from 'global-types'
import RoleView from 'auth/RoleView'
import {
  permitAdmin,
  permitLeaderAdmin,
  permitTellerStream,
} from 'permission-utils'

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
          {churchType === 'Bacenta' && church?.vacationStatus === 'Active' && (
            <MenuButton
              iconComponent={<Book />}
              title="Bacenta Service"
              color="members"
              onClick={() => navigate(`/services/bacenta`)}
              noCaption
            />
          )}
          {['Hub', 'Ministry'].includes(churchType) &&
            church?.vacationStatus === 'Active' && (
              <MenuButton
                iconComponent={<Book />}
                title="Fill Forms"
                color="members"
                onClick={() =>
                  navigate(`/services/${churchType.toLowerCase()}`)
                }
                noCaption
              />
            )}

          {['Stream', 'Governorship', 'Council'].includes(churchType) && (
            <MenuButton
              iconComponent={<Book />}
              title={`${churchType === 'Stream' ? 'Weekend' : 'Joint'} Service`}
              color="members"
              noCaption
              onClick={() =>
                navigate(`/${churchType.toLowerCase()}/record-service`)
              }
            />
          )}
          <MenuButton
            iconComponent={<BarChartFill />}
            title="Trends"
            color="members"
            noCaption
            onClick={() => {
              clickCard(church)
              navigate(`/trends`)
            }}
          />
          {/* {['Stream'].includes(churchType) && (
            <MenuButton
              iconComponent={<SpeakerFill />}
              title="Special Service Form"
              color="red"
              caption="ONLY to be used in the event of a special service"
              onClick={() => navigate(`/stream/record-special-service`)}
            />
          )} */}
          {['Stream', 'Council', 'Governorship', 'Bacenta'].includes(
            churchType
          ) &&
            church?.bankAccount !== 'manual' && (
              <MenuButton
                iconComponent={<FileEarmarkArrowUpFill />}
                title="Banking Slips"
                color="banking"
                noCaption
                onClick={() => {
                  clickCard(church)
                  navigate(
                    `/services/${churchType.toLowerCase()}/banking-slips`
                  )
                }}
              />
            )}

          {['Stream', 'Council', 'Governorship', 'Bacenta', 'Hub'].includes(
            churchType
          ) &&
            church?.bankAccount !== 'manual' && (
              <MenuButton
                iconComponent={<Coin />}
                title="Self Banking"
                color="banking"
                noCaption
                onClick={() =>
                  navigate(`/services/${churchType.toLowerCase()}/self-banking`)
                }
              />
            )}

          {church?.bankAccount === 'manual' &&
            church.__typename === 'Stream' && (
              <>
                <RoleView roles={permitAdmin('Stream')}>
                  <MenuButton
                    iconComponent={<PersonPlus />}
                    title="Add Stream Tellers"
                    color="banking"
                    onClick={() => navigate(`/anagkazo/treasurer-select`)}
                    noCaption
                  />
                </RoleView>

                <RoleView roles={permitTellerStream()}>
                  <MenuButton
                    iconComponent={<CashCoin />}
                    title="Receive Midweek Offering"
                    color="banking"
                    onClick={() => navigate(`/anagkazo/receive-banking`)}
                    noCaption
                  />
                </RoleView>
              </>
            )}

          {church.__typename !== 'Bacenta' ? (
            <RoleView
              roles={[
                ...permitLeaderAdmin('Governorship'),
                ...permitLeaderAdmin('Hub'),
              ]}
            >
              <MenuButton
                title="Defaulters"
                color="danger"
                iconComponent={<EmojiFrown />}
                onClick={() => navigate('/services/defaulters/dashboard')}
                noCaption
              />
            </RoleView>
          ) : null}
        </div>
      </Container>
    </div>
  )
}

export default Services
