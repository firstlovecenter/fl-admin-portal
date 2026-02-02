import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext, useEffect, useState } from 'react'
import { CAMPUS_BY_COUNCIL_ACCOUNTS } from './accountsGQL'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Button, Container } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { CouncilForAccounts, StreamForAccounts } from './accounts-types'
import HeadingSecondary from 'components/HeadingSecondary'
import { useRouter } from 'next/navigation'
import CurrencySpan from 'components/CurrencySpan'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import { Form, Formik } from 'formik'
import Input from 'components/formik/Input'

const CampusCouncilList = ({
  link,
}: {
  link:
    | '/accounts/council/make-deposit'
    | '/accounts/council/dashboard'
    | '/accounts/campus/bussing-expense-entry'
}) => {
  const { campusId, clickCard } = useContext(ChurchContext)
  const router = useRouter()

  const { data, loading, error } = useQuery(CAMPUS_BY_COUNCIL_ACCOUNTS, {
    variables: {
      id: campusId,
    },
  })

  const campus = data?.campuses[0]

  const [councilList, setCouncilList] = useState<CouncilForAccounts[]>([])

  useEffect(() => {
    if (campus) {
      const councils = campus.streams
        .map((stream: StreamForAccounts) => stream.councils)
        .flat()
      setCouncilList(councils)
    }
  }, [campus])

  const initialValues = {
    councilSearch: '',
  }

  const onSubmit = (values: typeof initialValues, onSubmitProps: any) => {
    onSubmitProps.setSubmitting(true)
    const councils = campus.streams
      .map((stream: StreamForAccounts) => stream.councils)
      .flat()

    setCouncilList(
      councils.filter(
        (council: any) =>
          council.name
            .toLowerCase()
            .includes(values.councilSearch.toLowerCase()) ||
          council.leader.firstName
            .toLowerCase()
            .includes(values.councilSearch.toLowerCase()) ||
          council.leader.lastName
            .toLowerCase()
            .includes(values.councilSearch.toLowerCase())
      )
    )

    onSubmitProps.setSubmitting(false)
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>{campus?.name} Campus Councils</HeadingPrimary>
        <HeadingSecondary>{`${campus?.name} ${campus?.__typename}`}</HeadingSecondary>

        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          {() => (
            <Form>
              <div>
                <Input
                  className="form-control church-search search-center"
                  name="councilSearch"
                  placeholder="Search Councils or Leader"
                  aria-describedby="Council Search"
                />
              </div>
            </Form>
          )}
        </Formik>

        {campus?.streams.map((stream: StreamForAccounts) => {
          // arrange in alphabetical order of council.leader.fullName and council.name
          const councils = [...stream.councils].sort(
            (a: CouncilForAccounts, b: CouncilForAccounts) => {
              if (a.leader.fullName < b.leader.fullName) {
                return -1
              }
              if (a.leader.fullName > b.leader.fullName) {
                return 1
              }
              return 0
            }
          )

          const showCouncils = councils.filter((council) =>
            councilList.includes(council)
          )

          return (
            <div key={stream.id} className="d-grid gap-2">
              <div className="fs-4 text-info">{stream.name} Councils</div>
              {stream.councils.length === 0 && (
                <Button className="text-start py-3" disabled>
                  There are no councils under this stream
                </Button>
              )}

              {showCouncils.map((council: CouncilForAccounts) => (
                <div
                  key={council.id}
                  onClick={() => {
                    clickCard(council)
                    router.push(link)
                  }}
                  className="d-grid"
                >
                  <Button className="text-start">
                    <MemberAvatarWithName member={council.leader} />
                    {council.name} Council
                  </Button>

                  <Button variant="outline-light" className="text-start">
                    Weekday Account -{' '}
                    <CurrencySpan number={council.weekdayBalance} negative />
                    <div>
                      Bussing Society -{' '}
                      <CurrencySpan
                        number={council.bussingSocietyBalance}
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
