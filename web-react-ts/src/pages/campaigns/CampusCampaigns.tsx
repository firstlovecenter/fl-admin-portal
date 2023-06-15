import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { GATHERING_SERVICE_CAMPAIGN_LIST } from './CampaignQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import CampaignsWithIcons from './components/buttons/CampaignsWithIcons'

const CampusCampaigns = () => {
  const { campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GATHERING_SERVICE_CAMPAIGN_LIST, {
    variables: { campusId: campusId },
  })

  const campaigns = data?.campuses[0]?.campaigns

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${data?.campuses[0]?.name} Campus`}</HeadingPrimary>
            <HeadingSecondary>SSMG Campaigns</HeadingSecondary>
          </div>
          <div className="d-grid gap-2 mt-4 text-center px-4">
            {campaigns?.map((campaign: string, index: number) => (
              <CampaignsWithIcons
                key={index}
                campaign={campaign}
                churchLevel="Campus"
              />
            ))}
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default CampusCampaigns
