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
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MenuButton from 'components/buttons/MenuButton'
import { BarChartFill } from 'react-bootstrap-icons'

const BacentaEquipmentCampaign = () => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()
  const campusId = currentUser?.campus

  const { data, loading, error } = useQuery(EQUIPMENT_END_DATE, {
    variables: {
      campusId: campusId,
    },
  })

  const equipmentEndDate = data?.campuses[0]?.equipmentEndDate

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename
  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
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
              onClick={() => navigate(`/campaigns/bacenta/equipment/trends`)}
              noCaption
              color="equipment"
            />
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default BacentaEquipmentCampaign
