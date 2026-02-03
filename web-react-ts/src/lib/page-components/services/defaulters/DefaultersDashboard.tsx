import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { capitalise, plural } from 'global-utils'
import React, { useContext } from 'react'
import { Accordion, Col, Container, Row } from 'react-bootstrap'
import {
  GOVERNORSHIP_DEFAULTERS,
  COUNCIL_DEFAULTERS,
  STREAM_DEFAULTERS,
  CAMPUS_DEFAULTERS,
  OVERSIGHT_DEFAULTERS,
} from './DefaultersQueries'
import PlaceholderCustom from 'components/Placeholder'
import DefaulterInfoCard from './DefaulterInfoCard'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin } from 'permission-utils'
import { MemberContext } from 'contexts/MemberContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import {
  DefaultersUseChurchType,
  HigherChurchWithDefaulters,
} from './defaulters-types'
import { ChurchLevel } from 'global-types'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  CREATIVEARTS_DEFAULTERS,
  HUBCOUNCIL_DEFAULTERS,
  HUB_DEFAULTERS,
  MINISTRY_DEFAULTERS,
} from './creative-arts/SontaDefaultersQueries'
import useSontaLevel from 'hooks/useSontaLevel'

const DefaultersDashboard = () => {
  const { currentUser } = useContext(MemberContext)
  const [governorshipDefaulters, { refetch: governorshipRefetch }] =
    useLazyQuery(GOVERNORSHIP_DEFAULTERS)
  const [councilDefaulters, { refetch: councilRefetch }] =
    useLazyQuery(COUNCIL_DEFAULTERS)
  const [streamDefaulters, { refetch: streamRefetch }] =
    useLazyQuery(STREAM_DEFAULTERS)
  const [campusDefaulters, { refetch: campusRefetch }] =
    useLazyQuery(CAMPUS_DEFAULTERS)
  const [oversightDefaulters, { refetch: oversightRefetch }] =
    useLazyQuery(OVERSIGHT_DEFAULTERS)
  const [hubDefaulters, { refetch: hubRefetch }] = useLazyQuery(HUB_DEFAULTERS)
  const [hubCouncilDefaulters, { refetch: hubCouncilRefetch }] = useLazyQuery(
    HUBCOUNCIL_DEFAULTERS
  )
  const [ministryDefaulters, { refetch: ministryRefetch }] =
    useLazyQuery(MINISTRY_DEFAULTERS)
  const [creativeArtsDefaulters, { refetch: creativeArtsRefetch }] =
    useLazyQuery(CREATIVEARTS_DEFAULTERS)

  let subChurch: ChurchLevel | string = ''

  const data = useSontaLevel({
    governorshipFunction: governorshipDefaulters,
    governorshipRefetch,
    councilFunction: councilDefaulters,
    councilRefetch,
    streamFunction: streamDefaulters,
    streamRefetch,
    campusFunction: campusDefaulters,
    campusRefetch,
    oversightFunction: oversightDefaulters,
    oversightRefetch,
    hubFunction: hubDefaulters,
    hubRefetch,
    hubCouncilFunction: hubCouncilDefaulters,
    hubCouncilRefetch,
    ministryFunction: ministryDefaulters,
    ministryRefetch,
    creativeArtsFunction: creativeArtsDefaulters,
    creativeArtsRefetch,
  })

  const { church, loading, error, refetch } = data as DefaultersUseChurchType

  switch (currentUser?.currentChurch?.__typename) {
    case 'Council':
      subChurch = 'governorship'
      break
    case 'Stream':
      subChurch = 'council'
      break

    case 'Campus':
      subChurch = 'stream'
      break
    case 'Oversight':
      subChurch = 'campus'
      break
    case 'Denomination':
      subChurch = 'oversight'
      break

    case 'Ministry':
      subChurch = 'hubCouncil'
      break
    case 'CreativeArts':
      subChurch = 'ministry'
      break
    default:
      break
  }

  const rehearsalDefaulters = [
    {
      title: 'Rehearsals This Week',
      data: church?.hubRehearsalsThisWeekCount,
      color: church?.hubRehearsalsThisWeekCount ? 'good' : 'bad',
      link: church?.hubRehearsalsThisWeekCount
        ? '/rehearsal/rehearsal-this-week'
        : '#',
    },
    {
      title: 'Not Filled Forms',
      data: church?.hubFormDefaultersThisWeekCount,
      color: church?.hubFormDefaultersThisWeekCount ? 'bad' : 'good',
      link: church?.hubFormDefaultersThisWeekCount
        ? '/rehearsal/form-defaulters'
        : '#',
    },
    {
      title: 'Have Banked',
      data: church?.hubsBankedThisWeekCount,
      color:
        church?.hubsBankedThisWeekCount === church?.hubRehearsalsThisWeekCount
          ? 'good'
          : (church?.hubsBankedThisWeekCount || 0) > 0
          ? 'yellow'
          : 'bad',
      link: church?.hubsBankedThisWeekCount ? '/rehearsal/banked' : '#',
    },
    {
      title: 'Have Not Banked',
      data: church?.hubBankingDefaultersThisWeekCount,
      color: church?.hubBankingDefaultersThisWeekCount ? 'bad' : 'good',
      link: church?.hubBankingDefaultersThisWeekCount
        ? '/rehearsal/banking-defaulters'
        : '#',
    },
    {
      title: 'Cancelled Rehearsal',
      data: church?.hubCancelledRehearsalsThisWeekCount,
      color: church?.hubCancelledRehearsalsThisWeekCount ? 'bad' : 'good',
      link: church?.hubCancelledRehearsalsThisWeekCount
        ? '/rehearsal/cancelled-rehearsals'
        : '#',
    },
  ]

  const streamDefaultersArray = [
    {
      title: 'Services This Week',
      data: church?.streamServicesThisWeekCount,
      color: church?.streamServicesThisWeekCount ? 'good' : 'bad',
      link: church?.streamServicesThisWeekCount
        ? '/stream-services/filled-services'
        : '#',
    },
    {
      title: 'Not Filled Forms',
      data: church?.streamFormDefaultersThisWeekCount,
      color: church?.streamFormDefaultersThisWeekCount ? 'bad' : 'good',
      link: church?.streamFormDefaultersThisWeekCount
        ? '/stream-services/form-defaulters'
        : '#',
    },
    {
      title: 'Have Banked',
      data: church?.streamBankedThisWeekCount,
      color:
        church?.streamBankedThisWeekCount ===
        church?.streamServicesThisWeekCount
          ? 'good'
          : (church?.streamBankedThisWeekCount || 0) > 0
          ? 'yellow'
          : 'bad',
      link: church?.streamBankedThisWeekCount ? '/stream-services/banked' : '#',
    },
    {
      title: 'Have Not Banked',
      data: church?.streamBankingDefaultersThisWeekCount,
      color: church?.streamBankingDefaultersThisWeekCount ? 'bad' : 'good',
      link: church?.streamBankingDefaultersThisWeekCount
        ? '/stream-services/banking-defaulters'
        : '#',
    },
    {
      title: 'Cancelled Service',
      data: church?.streamCancelledServicesThisWeekCount,
      color: church?.streamCancelledServicesThisWeekCount ? 'bad' : 'good',
      link: church?.streamCancelledServicesThisWeekCount
        ? '/stream-services/cancelled-services'
        : '#',
    },
  ]

  const bacentaDefaulters = [
    {
      title: 'Services This Week',
      data: church?.servicesThisWeekCount,
      color: church?.servicesThisWeekCount ? 'good' : 'bad',
      link: church?.servicesThisWeekCount ? '/services/filled-services' : '#',
    },
    {
      title: 'Not Filled Forms',
      data: church?.formDefaultersThisWeekCount,
      color: church?.formDefaultersThisWeekCount ? 'bad' : 'good',
      link: church?.formDefaultersThisWeekCount
        ? '/services/form-defaulters'
        : '#',
    },
    {
      title: 'Have Banked',
      data: church?.bankedThisWeekCount,
      color:
        church?.bankedThisWeekCount === church?.servicesThisWeekCount
          ? 'good'
          : (church?.bankedThisWeekCount || 0) > 0
          ? 'yellow'
          : 'bad',
      link: church?.bankedThisWeekCount ? '/services/banked' : '#',
    },
    {
      title: 'Have Not Banked',
      data: church?.bankingDefaultersThisWeekCount,
      color: church?.bankingDefaultersThisWeekCount ? 'bad' : 'good',
      link: church?.bankingDefaultersThisWeekCount
        ? '/services/banking-defaulters'
        : '#',
    },
    {
      title: 'Cancelled Service',
      data: church?.cancelledServicesThisWeekCount,
      color: church?.cancelledServicesThisWeekCount ? 'bad' : 'good',
      link: church?.cancelledServicesThisWeekCount
        ? '/services/cancelled-services'
        : '#',
    },
  ]

  const jointServiceDefaulters = [
    {
      title: 'Governorship Banked',
      data: church?.governorshipBankedThisWeekCount,
      color: church?.governorshipBankedThisWeekCount ? 'good' : 'bad',
      link: church?.governorshipBankedThisWeekCount
        ? '/services/governorship-banked'
        : '#',
    },
    {
      title: 'Governorship Not Banked',
      data: church?.governorshipBankingDefaultersThisWeekCount,
      color: church?.governorshipBankingDefaultersThisWeekCount
        ? 'bad'
        : 'good',
      link: church?.governorshipBankingDefaultersThisWeekCount
        ? '/services/governorship-banking-defaulters'
        : '#',
    },
    {
      title: 'Council Banked',
      data: church?.councilBankedThisWeekCount,
      color: church?.councilBankedThisWeekCount ? 'good' : 'bad',
      link: church?.councilBankedThisWeekCount
        ? '/services/council-banked'
        : '#',
    },
    {
      title: 'Council Not Banked',
      data: church?.councilBankingDefaultersThisWeekCount,
      color: church?.councilBankingDefaultersThisWeekCount ? 'bad' : 'good',
      link: church?.councilBankingDefaultersThisWeekCount
        ? '/services/council-banking-defaulters'
        : '#',
    },
  ]

  const aggregates = {
    title: capitalise(plural(subChurch)),
    data: church ? church[`${subChurch}Count`] : null,
    link: `/services/${church?.__typename?.toLowerCase()}-by-${subChurch?.toLowerCase()}`,
  }

  const getDefaultActiveKey = (church: HigherChurchWithDefaulters) => {
    if (
      ['Denomination', 'Oversight', 'Campus'].includes(church?.__typename ?? '')
    ) {
      return '0'
    }
    if (
      ['Stream', 'Council', 'Governorship'].includes(church?.__typename ?? '')
    ) {
      return '2'
    }

    if (
      ['CreativeArts', 'Ministry', 'HubCouncil'].includes(
        church?.__typename ?? ''
      )
    ) {
      return '1'
    }
  }
  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error}>
        <Container>
          <HeadingPrimary
            loading={!church}
          >{`${church?.name} ${church?.__typename}`}</HeadingPrimary>
          <HeadingSecondary>Defaulters Page</HeadingSecondary>
          <RoleView
            roles={[
              ...permitLeaderAdmin('Council'),
              ...permitLeaderAdmin('HubCouncil'),
            ]}
          >
            <Col xs={12} className="mb-3">
              {aggregates?.title && (
                <DefaulterInfoCard defaulter={aggregates} />
              )}
            </Col>
          </RoleView>
          <Accordion
            defaultActiveKey={getDefaultActiveKey(
              church as HigherChurchWithDefaulters
            )}
          >
            <Accordion.Item eventKey="0">
              {['Campus', 'Oversight', 'Denomination'].includes(
                church?.__typename ?? ''
              ) && (
                <>
                  <Accordion.Header>
                    <div>
                      <HeadingSecondary>Stream Services</HeadingSecondary>
                      <PlaceholderCustom as="h6" loading={!church}>
                        <h6>{`Active Streams: ${church?.activeStreamCount}`}</h6>
                      </PlaceholderCustom>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      {streamDefaultersArray.map((defaulter, i) => (
                        <Col key={i} xs={6} className="mb-3">
                          <DefaulterInfoCard defaulter={defaulter} />
                        </Col>
                      ))}
                    </Row>
                  </Accordion.Body>
                </>
              )}
            </Accordion.Item>

            <Accordion.Item eventKey="1">
              {['CreativeArts', 'Ministry', 'HubCouncil'].includes(
                church?.__typename ?? ''
              ) && (
                <>
                  <Accordion.Header>
                    <Col xs={12}>
                      <HeadingSecondary>Rehearsals</HeadingSecondary>
                      <PlaceholderCustom as="h6" loading={!church}>
                        <h6>{`Active Hubs: ${church?.activeHubCount}`}</h6>
                      </PlaceholderCustom>
                    </Col>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      {rehearsalDefaulters.map((defaulter, i) => (
                        <Col key={i} xs={6} className="mb-3">
                          <DefaulterInfoCard defaulter={defaulter} />
                        </Col>
                      ))}
                    </Row>
                  </Accordion.Body>
                </>
              )}
            </Accordion.Item>

            <Accordion.Item eventKey="2">
              {[
                'Campus',
                'Stream',
                'Council',
                'Governorship',
                'Hub',
                'HubCouncil',
                'Ministry',
                'CreativeArts',
              ].includes(church?.__typename ?? '') && (
                <>
                  <Accordion.Header>
                    <div>
                      <HeadingSecondary>Bacenta Services</HeadingSecondary>
                      <PlaceholderCustom as="h6" loading={!church}>
                        <h6>{`Active Bacentas: ${church?.activeBacentaCount}`}</h6>
                      </PlaceholderCustom>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      {bacentaDefaulters.map((defaulter, i) => (
                        <Col key={i} xs={6} className="mb-3">
                          <DefaulterInfoCard defaulter={defaulter} />
                        </Col>
                      ))}
                    </Row>
                  </Accordion.Body>
                </>
              )}
            </Accordion.Item>
            <Accordion.Item eventKey="3">
              {['Campus', 'Stream', 'Council'].includes(
                church?.__typename ?? ''
              ) && (
                <>
                  <Accordion.Header>Joint Services</Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      {jointServiceDefaulters.map((defaulter, i) => {
                        if (!defaulter.data) return null

                        return (
                          <Col key={i} xs={6} className="mb-3">
                            <DefaulterInfoCard defaulter={defaulter} />
                            <hr />
                          </Col>
                        )
                      })}
                    </Row>
                  </Accordion.Body>
                </>
              )}
            </Accordion.Item>

            <Accordion.Item eventKey="4">
              {['Campus'].includes(church?.__typename ?? '') && (
                <>
                  <Accordion.Header>
                    <div>
                      <HeadingSecondary>Rehearsals</HeadingSecondary>
                      <PlaceholderCustom as="h6" loading={!church}>
                        <h6>{`Active Hubs: ${church?.activeHubCount}`}</h6>
                      </PlaceholderCustom>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <RoleView roles={['leaderCampus', 'adminCampus']}>
                        <Col xs={12} className="mb-3">
                          {aggregates?.title && (
                            <DefaulterInfoCard
                              defaulter={{
                                title: 'Creative Arts',
                                data: church?.creativeArtsCount,
                                link: `/services/campus-by-creativearts`,
                              }}
                            />
                          )}
                        </Col>
                      </RoleView>

                      {rehearsalDefaulters.map((defaulter, i) => (
                        <Col key={i} xs={6} className="mb-3">
                          <DefaulterInfoCard defaulter={defaulter} />
                        </Col>
                      ))}
                    </Row>
                  </Accordion.Body>
                </>
              )}
            </Accordion.Item>
          </Accordion>
          <Row>
            {loading && (
              <Row>
                {[1, 2, 3, 4, 5].map((number: number) => (
                  <Col key={number} xs={6} className="mb-3">
                    <DefaulterInfoCard
                      defaulter={{ title: '-', data: undefined, link: '#' }}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Row>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default DefaultersDashboard
