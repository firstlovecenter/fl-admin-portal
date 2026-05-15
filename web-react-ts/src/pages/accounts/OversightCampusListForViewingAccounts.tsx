import { useQuery } from '@apollo/client'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext, useEffect, useState } from 'react'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import CurrencySpan from 'components/CurrencySpan'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import { Form, Formik, FormikHelpers } from 'formik'
import Input from 'components/formik/Input'
import { useNavigate } from 'react-router'
import { Button } from 'components/ui/button'
import { OVERSIGHT_BY_CAMPUS_ACCOUNT } from './accountsGQL'
import { CampusForAccounts, StreamForAccounts } from './accounts-types'

const CampusCouncilList = () => {
  const { oversightId, clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

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

  const onSubmit = (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    onSubmitProps.setSubmitting(true)
    const streams = oversight.campuses
      .map((campus: CampusForAccounts) => campus.streams)
      .flat()

    setStreamList(
      streams.filter(
        (stream: StreamForAccounts) =>
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
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <HeadingPrimary>{oversight?.name} Oversight Campuses</HeadingPrimary>
        <HeadingSecondary>{`${oversight?.name} ${oversight?.__typename}`}</HeadingSecondary>

        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          {() => (
            <Form>
              <Input
                className="form-control church-search search-center"
                name="councilSearch"
                placeholder="Search Councils or Leader"
                aria-describedby="Stream Search"
              />
            </Form>
          )}
        </Formik>

        {oversight?.campuses.map((campus: CampusForAccounts) => {
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
            <div key={campus.id} className="grid gap-2">
              <div className="text-lg font-medium text-[hsl(var(--maps))]">
                {campus.name} Campus
              </div>
              {campus.streams.length === 0 && (
                <Button
                  variant="secondary"
                  className="justify-start py-3 text-left"
                  disabled
                >
                  There are no streams under this campus
                </Button>
              )}

              {showCouncils.map((stream: StreamForAccounts) => (
                <div
                  key={stream.id}
                  onClick={() => {
                    clickCard(campus)
                    navigate('/accounts/campus/dashboard')
                  }}
                  className="grid cursor-pointer gap-1"
                >
                  <Button
                    variant="default"
                    className="h-auto justify-start whitespace-normal py-3 text-left"
                  >
                    <MemberAvatarWithName member={stream.leader} />
                    <span className="ml-2">{stream.name} Stream</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto justify-start whitespace-normal py-3 text-left"
                  >
                    <div>
                      <div>
                        Weekday Account -{' '}
                        <CurrencySpan
                          number={stream.weekdayBalance}
                          negative
                        />
                      </div>
                      <div>
                        Bussing Society -{' '}
                        <CurrencySpan
                          number={stream.bussingSocietyBalance}
                          negative
                        />
                      </div>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </ApolloWrapper>
  )
}

export default CampusCouncilList
