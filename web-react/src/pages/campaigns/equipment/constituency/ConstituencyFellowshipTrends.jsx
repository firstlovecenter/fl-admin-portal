import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import { useQuery } from '@apollo/client'
import { FELLOWSHIP_RECORDS_PER_CONSTITUENCY } from '../../CampaignQueries'
import BaseComponent from 'components/base-component/BaseComponent'
import { ChurchContext } from 'contexts/ChurchContext'
import FellowshipTrendsButton from '../../components/buttons/FellowshipTrendsButton'

const ConstituencyFellowshipTrends = () => {
  const { currentUser } = useContext(MemberContext)
  const { constituencyId } = useContext(ChurchContext)

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  const { data, loading, error } = useQuery(
    FELLOWSHIP_RECORDS_PER_CONSTITUENCY,
    {
      variables: { constituencyId: constituencyId },
    }
  )
  const fellowships = data?.constituencies[0]?.bacentas[0]?.fellowships

  return (
    <BaseComponent data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <h1 className="mb-1 ">EQ CAMPAIGN</h1>
            <h6>{`${church?.name} ${churchType}`}</h6>
          </div>
          <div className="d-grid gap-2 mt-4 text-center px-2">
            {fellowships?.map((fellowship, index) => (
              <FellowshipTrendsButton key={index} church={fellowship} />
            ))}
          </div>
        </Container>
      </div>
    </BaseComponent>
  )
}

export default ConstituencyFellowshipTrends
