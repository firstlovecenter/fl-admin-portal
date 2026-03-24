import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import Input from 'components/formik/Input'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { Form, Formik, FormikHelpers } from 'formik'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import PlaceholderDefaulterList from 'pages/services/defaulters/PlaceholderDefaulterList'
import { useContext, useEffect, useState } from 'react'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { BacentaWithArrivals } from '../arrivals-types'
import { COUNCIL_VEHICLES_TO_BE_PAID } from '../bussingStatusQueries'
import NoData from '../CompNoData'
import VehicleButtonPayment from '../components/VehiclePaymentButton'
import { useNavigate } from 'react-router'
import { Button } from 'components/ui/button'

type FormOptions = {
  bacentaSearch: string
}

const StateBacentasToBePaid = () => {
  const { councilId, clickCard, arrivalDate } = useContext(ChurchContext)
  const { data, loading, error, refetch } = useQuery(
    COUNCIL_VEHICLES_TO_BE_PAID,
    {
      variables: {
        id: councilId,
        arrivalDate,
      },
      pollInterval: SHORT_POLL_INTERVAL,
    }
  )
  const [seePaid, setSeePaid] = useState(false)
  const navigate = useNavigate()

  const church = data?.councils[0]

  const initialValues: FormOptions = {
    bacentaSearch: '',
  }

  const bacentaDataLoaded = church ? church?.bacentasToBePaid : []
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
      church?.bacentasToBePaid.filter((bacenta: BacentaWithArrivals) => {
        if (bacenta.name.toLowerCase().includes(searchTerm)) {
          return true
        } else if (bacenta.leader.fullName.toLowerCase().includes(searchTerm)) {
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
        <div>
          <HeadingPrimary loading={loading}>
            Bacentas {seePaid ? 'To Be Paid' : 'Yet To Be Paid'}
          </HeadingPrimary>
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
              <div className="mt-2">
                <Button
                  variant={'warning'}
                  disabled={!seePaid}
                  onClick={() => setSeePaid(false)}
                >
                  Unpaid
                </Button>
                <Button
                  variant={`success`}
                  disabled={seePaid}
                  onClick={() => setSeePaid(true)}
                >
                  Paid
                </Button>
              </div>
            </div>
          ) : null}

          {bacentaData?.map((bacenta: BacentaWithArrivals) => {
            const recordsToRender = seePaid
              ? bacenta.bussingThisWeek.vehicleRecords.filter(
                  (record) => record.transactionStatus === 'success'
                )
              : bacenta.bussingThisWeek.vehicleRecords.filter(
                  (record) => record.transactionStatus !== 'success'
                )

            if (recordsToRender.length === 0) {
              return (
                <NoData
                  key={bacenta.id}
                  text={
                    seePaid
                      ? 'There are no bacentas that have been paid'
                      : 'There are no bacentas to be paid'
                  }
                />
              )
            }

            return recordsToRender.map((record, i) => (
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
                  <VehicleButtonPayment
                    record={record}
                    onClick={() => {
                      clickCard(record)
                      record.transactionStatus === 'success'
                        ? navigate('/bacenta/vehicle-details')
                        : navigate('/arrivals/pay-vehicle')
                    }}
                  />
                </div>
              </MemberDisplayCard>
            ))
          })}

          {!church?.bacentasToBePaid.length && loading && (
            <PlaceholderDefaulterList />
          )}

          {!bacentaData?.length && (
            <NoData text="There are no bacentas to be paid" />
          )}
        </div>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StateBacentasToBePaid
