import React, { useContext, useState, useEffect } from 'react'
import { Button, Card, Container, Spinner, Table } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import PlaceholderCustom from 'components/Placeholder'
import { GOVERNORSHIP_BANKING_DEFUALTERS_THIS_WEEK } from 'pages/services/defaulters/DefaultersQueries'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Formik, Form, FormikHelpers } from 'formik'
import { useNavigate } from 'react-router-dom'
import usePopup from 'hooks/usePopup'
import { CONFIRM_BANKING } from './Treasury.gql'
import CloudinaryImage from 'components/CloudinaryImage'
import { DISPLAY_AGGREGATE_SERVICE_RECORD } from 'pages/services/record-service/RecordServiceMutations'
import { alertMsg, throwToSentry } from 'global-utils'
import Popup from 'components/Popup/Popup'
import NoDataComponent from 'pages/arrivals/CompNoData'
import Input from 'components/formik/Input'
import './TellerSelect.css'
import { getWeekNumber } from '@jaedag/admin-portal-types'
import { Church } from 'global-types'

type FormOptions = {
  defaulterSearch: string
}

interface Defaulter extends Church {
  id: string
  name: string
}

const ConfirmAnagkazoBanking = () => {
  const { currentUser } = useContext(MemberContext)
  const church = currentUser?.currentChurch
  const churchType = currentUser.currentChurch?.__typename
  const { streamId } = useContext(ChurchContext)
  const [isSubmitting, setSubmitting] = useState(false)
  const [defaulterIndex, setDefaulterIndex] = useState(0)
  const [selected, setSelected] = useState<Defaulter>()
  const [defaultersData, setDefaultersData] = useState<Church[]>([])
  const { togglePopup, isOpen } = usePopup()
  const navigate = useNavigate()

  const { data, loading, error, refetch } = useQuery(
    GOVERNORSHIP_BANKING_DEFUALTERS_THIS_WEEK,
    {
      variables: { id: streamId },
      fetchPolicy: 'cache-and-network',
    }
  )

  const [
    getGovernorshipServiceRecordThisWeek,
    { data: governorshipServiceData, loading: governorshipServiceLoading },
  ] = useLazyQuery(DISPLAY_AGGREGATE_SERVICE_RECORD)

  const [ConfirmBanking] = useMutation(CONFIRM_BANKING)

  const service =
    governorshipServiceData?.governorships[0]?.aggregateServiceRecordForWeek

  const governorshipServices =
    data?.streams[0]?.governorshipBankingDefaultersThisWeek ?? []

  const bankingDefaultersList: Church[] = [...governorshipServices]

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    setDefaultersData(
      bankingDefaultersList.filter((defaulter: Defaulter) =>
        defaulter.name
          .toLowerCase()
          .includes(values.defaulterSearch.toLowerCase())
      )
    )

    onSubmitProps.setSubmitting(false)
  }

  useEffect(() => {
    setDefaultersData(bankingDefaultersList)
  }, [governorshipServices])

  const initialValues: FormOptions = {
    defaulterSearch: '',
  }

  return (
    <div className="d-flex align-items-center justify-content-center ">
      <Container>
        <PlaceholderCustom xs={12} as="h1">
          <div className="text-center">
            <h1 className="mb-0  page-header">{`${church?.name} ${churchType}`}</h1>
            <p className={`menu-subheading`}>Receive Offering</p>
          </div>
        </PlaceholderCustom>

        <ApolloWrapper data={data} loading={loading} error={error}>
          <div>
            <Formik initialValues={initialValues} onSubmit={onSubmit}>
              {() => (
                <Form>
                  <div>
                    <Input
                      className="form-control church-search search-center"
                      name="defaulterSearch"
                      placeholder="Search Churches"
                      aria-describedby="Defaulter Search"
                    />
                  </div>
                </Form>
              )}
            </Formik>
            <div className="text-center mt-2 mb-3">Week {getWeekNumber()}</div>
            <Container>
              <div className="d-grid ">
                {isOpen && (
                  <Popup handleClose={togglePopup}>
                    {governorshipServiceLoading ? (
                      <div className="center-spinner">
                        <Spinner animation="border" variant="secondary" />
                      </div>
                    ) : (
                      <>
                        <h3 className={` menu-subheading text-center`}>
                          {selected?.name} {selected?.__typename}
                        </h3>
                        <h6 className="text-center">Confirm Offering?</h6>
                        <Table striped bordered hover variant="dark">
                          <tbody>
                            <tr>
                              <td>Income</td>
                              <td className="text-break">{service?.income}</td>
                            </tr>
                            {service?.foreignCurrency && (
                              <tr>
                                <td>Foreign Currency</td>
                                <td className="text-break">
                                  {service?.foreignCurrency}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                        <i className="text-danger">
                          NB: You must only click this button if the amount the
                          governorship is submitting is the same as what is
                          displayed here
                        </i>
                        <div className="text-end mt-3">
                          <Button
                            variant="primary"
                            type="submit"
                            disabled={isSubmitting}
                            onClick={async () => {
                              setSubmitting(true)

                              try {
                                await ConfirmBanking({
                                  variables: {
                                    governorshipId: selected?.id,
                                  },
                                })
                                togglePopup()
                                alertMsg('Banking Confirmed Successfully')

                                setSubmitting(false)
                                refetch({ id: streamId })
                                navigate('/anagkazo/receive-banking')
                              } catch (error: any) {
                                setSubmitting(false)
                                throwToSentry(error)
                              }
                            }}
                          >
                            {isSubmitting ? (
                              <>
                                <Spinner animation="grow" size="sm" />
                                <span> Submitting</span>
                              </>
                            ) : (
                              `Yes, I'm sure`
                            )}
                          </Button>
                          <Button variant="secondary" onClick={togglePopup}>
                            No, take me back
                          </Button>
                        </div>
                      </>
                    )}
                  </Popup>
                )}
                {defaultersData?.map((defaulter: Defaulter, index: number) => (
                  <Card key={index} className="confirm-banking-card mt-2">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <CloudinaryImage
                          className="rounded-circle img-search"
                          src={defaulter?.leader?.pictureUrl}
                          alt={defaulter?.leader?.fullName}
                        />
                      </div>

                      <div className="flex-grow-1 ms-3">
                        <h6 className="fw-bold">{`${defaulter?.name} ${defaulter.__typename}`}</h6>
                        <p className={`text-secondary mb-0 `}>
                          <span>{defaulter?.leader?.fullName}</span>
                        </p>
                      </div>
                    </div>
                    <Card.Footer className="text-center">
                      <Button
                        disabled={governorshipServiceLoading}
                        onClick={async () => {
                          setDefaulterIndex(index)
                          setSelected(defaulter)
                          togglePopup()
                          await getGovernorshipServiceRecordThisWeek({
                            variables: {
                              governorshipId: defaulter.id,
                              week: getWeekNumber(),
                            },
                          })
                        }}
                        variant="info"
                      >
                        {governorshipServiceLoading &&
                        index === defaulterIndex ? (
                          <>
                            <Spinner animation="border" size="sm" />{' '}
                            <span>Loading...</span>
                          </>
                        ) : (
                          'Confirm Offering'
                        )}
                      </Button>
                    </Card.Footer>
                  </Card>
                ))}
              </div>

              {!bankingDefaultersList?.length && !loading && (
                <NoDataComponent text="There are no services to be confirmed" />
              )}
            </Container>
          </div>
        </ApolloWrapper>
      </Container>
    </div>
  )
}
export default ConfirmAnagkazoBanking
