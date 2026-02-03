import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext, useEffect, useState } from 'react'
import { OVERSIGHT_BY_CAMPUS_ACCOUNT } from './accountsGQL'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Button, Container } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { CampusForAccounts, StreamForAccounts } from './accounts-types'
import HeadingSecondary from 'components/HeadingSecondary'
import CurrencySpan from 'components/CurrencySpan'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import { Form, Formik } from 'formik'
import Input from 'components/formik/Input'
import { useRouter } from 'next/navigation'

const CampusCouncilList = () => {
  const { oversightId, clickCard } = useContext(ChurchContext)
  const router = useRouter()

  const { data, loading, error } = useQuery(OVERSIGHT_BY_CAMPUS_ACCOUNT, {
    variables: {
      id: oversightId,
    },
  })

  const oversight = data?.oversights[0]

  const [streamList, setStreamList] = useState<StreamForAccounts[]>([])

  useEffect(() => {
    if (oversight) {
      const streams = oversight.campuses
        .map((campus: CampusForAccounts) => campus.streams)
        .flat()
      setStreamList(streams)
    }
  }, [oversight])

  const initialValues = {
    councilSearch: '',
  }

  const onSubmit = (values: typeof initialValues, onSubmitProps: any) => {
    onSubmitProps.setSubmitting(true)
    const streams = oversight.campuses
      .map((campus: CampusForAccounts) => campus.streams)
      .flat()

    setStreamList(
      streams.filter(
        (stream: any) =>
          stream.name
            .toLowerCase()
            .includes(values.councilSearch.toLowerCase()) ||
          stream.leader.firstName
            .toLowerCase()
            .includes(values.councilSearch.toLowerCase()) ||
          stream.leader.lastName
            .toLowerCase()
            .includes(values.councilSearch.toLowerCase())
      )
    )

    onSubmitProps.setSubmitting(false)
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>{oversight?.name} Oversight Campuses</HeadingPrimary>
        <HeadingSecondary>{`${oversight?.name} ${oversight?.__typename}`}</HeadingSecondary>

        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          {() => (
            <Form>
              <div>
                <Input
                  className="form-control church-search search-center"
                  name="councilSearch"
                  placeholder="Search Councils or Leader"
                  aria-describedby="Stream Search"
                />
              </div>
            </Form>
          )}
        </Formik>

        {oversight?.campuses.map((campus: CampusForAccounts) => {
          // arrange in alphabetical order of stream.leader.fullName and stream.name
          const councils = [...campus.streams].sort(
            (a: StreamForAccounts, b: StreamForAccounts) => {
              if (a.leader.fullName < b.leader.fullName) {
                return -1
              }
              if (a.leader.fullName > b.leader.fullName) {
                return 1
              }
              return 0
            }
          )

          const showCouncils = councils.filter((stream) =>
            streamList.includes(stream)
          )

          return (
            <div key={campus.id} className="d-grid gap-2">
              <div className="fs-4 text-info">{campus.name} Campus</div>
              {campus.streams.length === 0 && (
                <Button className="text-start py-3" disabled>
                  There are no streams under this campus
                </Button>
              )}

              {showCouncils.map((stream: StreamForAccounts) => (
                <div
                  key={stream.id}
                  onClick={() => {
                    clickCard(campus)
                    router.push('/accounts/campus/dashboard')
                  }}
                  className="d-grid"
                >
                  <Button className="text-start">
                    <MemberAvatarWithName member={stream.leader} />
                    {stream.name} Stream
                  </Button>

                  <Button variant="outline-light" className="text-start">
                    Weekday Account -{' '}
                    <CurrencySpan number={stream.weekdayBalance} negative />
                    <div>
                      Bussing Society -{' '}
                      <CurrencySpan
                        number={stream.bussingSocietyBalance}
                        negative
                      />
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          )
        })}
      </Container>
    </ApolloWrapper>
  )
}

export default CampusCouncilList
