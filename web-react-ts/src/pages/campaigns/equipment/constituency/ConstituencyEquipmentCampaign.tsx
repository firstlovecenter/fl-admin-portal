import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { MemberContext } from 'contexts/MemberContext'
import {
  CONSTITUENCY_LATEST_EQUIPMENT_RECORD,
  EQUIPMENT_END_DATE,
} from 'pages/campaigns/CampaignQueries'
import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import RoleView from 'auth/RoleView'
import { permitAdmin } from 'permission-utils'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { getHumanReadableDate } from 'jd-date-utils'
import Placeholder from '../../../../components/Placeholder'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MenuButton from 'components/buttons/MenuButton'
import { BarChartFill, EmojiFrown, PencilSquare } from 'react-bootstrap-icons'

const ConstituencyEquipmentCampaign = () => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename
  const { constituencyId } = useContext(ChurchContext)
  const gatheringServiceId = currentUser?.gatheringService

  const { data, loading } = useQuery(CONSTITUENCY_LATEST_EQUIPMENT_RECORD, {
    variables: {
      constituencyId: constituencyId,
    },
  })

  const constituencyEquipmentRecord = data?.constituencies[0]?.equipmentRecord

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
            {constituencyEquipmentRecord?.pulpits === null && (
              <MenuButton
                title="Fill Campaign Form"
                iconComponent={PencilSquare}
                onClick={() =>
                  navigate(`/campaigns/constituency/equipment/form`)
                }
                noCaption
                color="equipment"
              />
            )}

            <MenuButton
              title="View Trends"
              color="equipment"
              iconComponent={BarChartFill}
              onClick={() =>
                navigate(`/campaigns/constituency/equipment/trends`)
              }
              noCaption
            />
            <RoleView roles={permitAdmin('Constituency')}>
              <MenuButton
                title="Defaulters"
                color="danger"
                iconComponent={EmojiFrown}
                onClick={() =>
                  navigate('/campaigns/constituency/equipment/defaulters')
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

export default ConstituencyEquipmentCampaign
