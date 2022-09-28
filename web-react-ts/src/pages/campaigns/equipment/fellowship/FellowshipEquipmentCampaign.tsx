import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import MenuButton from '../../components/buttons/MenuButton'
import { useNavigate } from 'react-router'
import { MemberContext } from 'contexts/MemberContext'
import {
  FELLOWSHIP_LATEST_EQUIPMENT_RECORD,
  EQUIPMENT_END_DATE,
} from 'pages/campaigns/CampaignQueries'
import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { getHumanReadableDate } from 'jd-date-utils'
import Placeholder from '../../../../components/Placeholder'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const FellowshipEquipmentCampaign = () => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename
  const { fellowshipId } = useContext(ChurchContext)
  const gatheringServiceId = currentUser?.gatheringService

  const { data, loading } = useQuery(FELLOWSHIP_LATEST_EQUIPMENT_RECORD, {
    variables: {
      fellowshipId: fellowshipId,
    },
  })

  const fellowshipEquipmentRecord = data?.fellowships[0]?.equipmentRecord

  const {
    data: equipmentEndDateData,
    loading: equipmentEndDateLoading,
    error,
  } = useQuery(EQUIPMENT_END_DATE, {
    variables: {
      gatheringServiceId: gatheringServiceId,
    },
  })

  const equipmentEndDate =
    equipmentEndDateData?.gatheringServices[0]?.equipmentEndDate

  return (
    <ApolloWrapper
      loading={loading || equipmentEndDateLoading}
      data={data && equipmentEndDateData}
      error={error}
    >
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
            <HeadingSecondary>Equipment Campaign</HeadingSecondary>
          </div>
          <Placeholder
            as="h6"
            loading={equipmentEndDateLoading}
            className="text-center"
          >
            <h6 className="text-danger text-center">
              Current Deadline : {getHumanReadableDate(equipmentEndDate)}{' '}
            </h6>
          </Placeholder>
          <div className="d-grid gap-2 mt-4 text-center px-4">
            {fellowshipEquipmentRecord === null && (
              <MenuButton
                name="Fill Campaign Form"
                onClick={() => navigate(`/campaigns/fellowship/equipment/form`)}
              />
            )}

            <MenuButton
              name="View Trends"
              onClick={() => navigate(`/campaigns/fellowship/equipment/trends`)}
            />
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default FellowshipEquipmentCampaign
