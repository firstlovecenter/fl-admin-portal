import { useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import Input from 'components/formik/Input'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { Form, Formik, FormikHelpers } from 'formik'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import useChurchLevel from 'hooks/useChurchLevel'
import PlaceholderDefaulterList from 'pages/services/defaulters/PlaceholderDefaulterList'
import { useContext, useEffect, useState } from 'react'
import { Button, ButtonGroup, Container } from 'react-bootstrap'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { ArrivalsUseChurchType, BacentaWithArrivals } from '../arrivals-types'
import {
  GOVERNORSHIP_BACENTAS_TO_COUNT,
  COUNCIL_BACENTAS_TO_COUNT,
  CAMPUS_BACENTAS_TO_COUNT,
  STREAM_BACENTAS_TO_COUNT,
} from '../bussingStatusQueries'
import NoData from '../CompNoData'
import VehicleButton from '../components/VehicleButton'

type FormOptions = {
  bacentaSearch: string
}

const StateBacentasToCount = () => {
  const { clickCard } = useContext(ChurchContext)
  const [governorshipOnTheWay, { refetch: governorshipRefetch }] = useLazyQuery(
    GOVERNORSHIP_BACENTAS_TO_COUNT,
    {
      pollInterval: SHORT_POLL_INTERVAL,
    }
  )
  const [councilOnTheWay, { refetch: councilRefetch }] = useLazyQuery(
    COUNCIL_BACENTAS_TO_COUNT,
    {
      pollInterval: SHORT_POLL_INTERVAL,
    }
  )
  const [streamOnTheWay, { refetch: streamRefetch }] = useLazyQuery(
    STREAM_BACENTAS_TO_COUNT,
    {
      pollInterval: SHORT_POLL_INTERVAL,
    }
  )
  const [campusOnTheWay, { refetch: campusRefetch }] = useLazyQuery(
    CAMPUS_BACENTAS_TO_COUNT
  )
  const [seeCars, setSeeCars] = useState(true)
  const [seeBusses, setSeeBusses] = useState(true)

  const data = useChurchLevel({
    governorshipFunction: governorshipOnTheWay,
    governorshipRefetch,
    councilFunction: councilOnTheWay,
    councilRefetch,
    streamFunction: streamOnTheWay,
    streamRefetch,
    campusFunction: campusOnTheWay,
    campusRefetch,
  })

  const { church, loading, error, refetch } = data as ArrivalsUseChurchType

  // Searching Feature
  const initialValues: FormOptions = {
    bacentaSearch: '',
  }

  const bacentaDataLoaded = church ? church?.bacentasNotCounted : []
  const [bacentaData, setBacentaData] = useState<
    BacentaWithArrivals[] | undefined
  >([])

  useEffect(() => {
    setBacentaData(bacentaDataLoaded)
  }, [church])

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    const searchTerm = values.bacentaSearch.toLowerCase()
    setBacentaData(
      church?.bacentasNotCounted.filter((bacenta: BacentaWithArrivals) => {
        if (bacenta.name.toLowerCase().includes(searchTerm)) {
          return true
        }
        if (bacenta.leader.fullName.toLowerCase().includes(searchTerm)) {
          return true
        }

        return false
      })
    )

    onSubmitProps.setSubmitting(false)
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={church} loading={loading} error={error} placeholder>
        <Container>
          <>
            <HeadingPrimary loading={loading}>Bacentas To Count</HeadingPrimary>
            <HeadingSecondary loading={!church?.name}>
              {church?.name} {church?.__typename}
            </HeadingSecondary>
            <Formik initialValues={initialValues} onSubmit={onSubmit}>
              {() => (
                <Form>
                  <div className="align-middle">
                    <Input
                      className="form-control member-search w-100"
                      name="bacentaSearch"
                      placeholder="Search Bacentas"
                      aria-describedby="Bacenta Search"
                    />
                  </div>
                </Form>
              )}
            </Formik>
            {church && bacentaData?.length ? (
              <div className="d-grid gap-2">
                <ButtonGroup className="mt-2">
                  <Button
                    variant="info"
                    className={`${!seeBusses && 'low-opacity'} me-2`}
                    onClick={() => setSeeBusses(!seeBusses)}
                  >
                    Sprinter and Urvan
                  </Button>
                  <Button
                    variant="success"
                    className={`${!seeCars && 'low-opacity'}`}
                    onClick={() => setSeeCars(!seeCars)}
                  >
                    Car and Uber
                  </Button>
                </ButtonGroup>
              </div>
            ) : null}
            {church && !bacentaData?.length && (
              <NoData text="There are no bacentas to be counted" />
            )}
            {bacentaData?.map((bacenta: BacentaWithArrivals) =>
              bacenta.bussingThisWeek.vehicleRecords.map((record, i) => {
                if (record.arrivalTime) {
                  return null
                }
                if (
                  !seeBusses &&
                  (record.vehicle === 'Sprinter' || record.vehicle === 'Urvan')
                ) {
                  return null
                }

                if (!seeCars && record.vehicle === 'Car') {
                  return null
                }

                return (
                  <MemberDisplayCard
                    key={i}
                    member={bacenta}
                    leader={bacenta.leader}
                    contact
                    onClick={() => {
                      clickCard(bacenta)
                      clickCard(bacenta.bussingThisWeek)
                    }}
                  >
                    <div className="d-grid gap-2 mt-2">
                      <VehicleButton record={record} />
                    </div>
                  </MemberDisplayCard>
                )
              })
            )}
            {!church?.bacentasNotCounted.length && loading && (
              <PlaceholderDefaulterList />
            )}
          </>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StateBacentasToCount
