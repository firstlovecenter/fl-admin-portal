import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { MemberContext } from 'contexts/MemberContext'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { EQUIPMENT_END_DATE } from 'pages/campaigns/CampaignQueries'
import { useQuery } from '@apollo/client'
import { getHumanReadableDate } from 'jd-date-utils'
import Placeholder from '../../../../components/Placeholder'
import RoleView from 'auth/RoleView'
import { permitAdmin } from 'permission-utils'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MenuButton from 'components/buttons/MenuButton'
import { BarChartFill, Alarm, EmojiFrown } from 'react-bootstrap-icons'

const CampusEquipmentCampaign = () => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch
  const campusId = currentUser?.campus

  const { data, loading, error } = useQuery(EQUIPMENT_END_DATE, {
    variables: {
      campusId: campusId,
    },
  })

  const equipmentEndDate = data?.campuses[0]?.equipmentEndDate

  return (
    <ApolloWrapper loading={loading} data={data} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${church?.name} Campus`}</HeadingPrimary>
            <HeadingSecondary>Equipment Campaign</HeadingSecondary>
          </div>
          <Placeholder as="h6" loading={loading} className="text-center">
            <h6 className="text-danger text-center">
              Current Deadline : {getHumanReadableDate(equipmentEndDate)}{' '}
            </h6>
          </Placeholder>
          <div className="d-grid gap-2 mt-4 text-center px-4">
            <MenuButton
              iconComponent={<BarChartFill />}
              title="View Trends"
              color="equipment"
              onClick={() => navigate(`/campaigns/campus/equipment/trends`)}
              noCaption
            />
            <MenuButton
              iconComponent={<Alarm />}
              title="Set Deadline"
              color="equipment"
              onClick={() =>
                navigate(`/campaigns/campus/set-equipment-deadline`)
              }
              noCaption
            />
            <RoleView roles={permitAdmin('Campus')}>
              <MenuButton
                iconComponent={<EmojiFrown />}
                color="danger"
                title="Defaulters"
                onClick={() =>
                  navigate('/campaigns/campus/equipment/defaulters')
                }
                noCaption
              />
            </RoleView>
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default CampusEquipmentCampaign
