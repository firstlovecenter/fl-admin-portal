import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import MenuButton from './components/buttons/MenuButton'
import { useNavigate } from 'react-router'
import { useQuery } from '@apollo/client'
import { STREAM_CAMPAIGN_LIST } from './CampaignQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { MemberContext } from 'contexts/MemberContext'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'

const StreamCampaigns = () => {
  const { streamId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  const { data, loading, error } = useQuery(STREAM_CAMPAIGN_LIST, {
    variables: { streamId: streamId },
  })

  const navigate = useNavigate()
  const campaigns = data?.streams[0]?.campaigns

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
            <HeadingSecondary>SSMG Campaigns</HeadingSecondary>
          </div>
          <div className="d-grid gap-2 mt-4 text-center px-4">
            {campaigns?.map((campaign: string, index: number) => (
              <MenuButton
                key={index}
                name={campaign}
                onClick={() =>
                  navigate(
                    `/campaigns/stream/${campaign
                      .toLowerCase()
                      .replace(' ', '-')}`
                  )
                }
              />
            ))}
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default StreamCampaigns
