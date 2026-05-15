import React, { useContext, useState, useEffect } from 'react'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import PlaceholderCustom from 'components/Placeholder'
import { GOVERNORSHIP_BANKING_DEFUALTERS_THIS_WEEK } from 'pages/services/defaulters/DefaultersQueries'
import { useQuery, useMutation, useLazyQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Formik, Form, FormikHelpers } from 'formik'
import { useNavigate } from 'react-router-dom'
import usePopup from 'hooks/usePopup'
import CloudinaryImage from 'components/CloudinaryImage'
import { DISPLAY_AGGREGATE_SERVICE_RECORD } from 'pages/services/record-service/RecordServiceMutations'
import { alertMsg, getWeekNumber, throwToSentry } from 'global-utils'
import Popup from 'components/Popup/Popup'
import NoDataComponent from 'pages/arrivals/CompNoData'
import Input from 'components/formik/Input'
import { Church } from 'global-types'
import { Loader2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Card, CardFooter } from 'components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from 'components/ui/table'
import { CONFIRM_BANKING } from './Treasury.gql'
import './TellerSelect.css'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [governorshipServices])

  const initialValues: FormOptions = {
    defaulterSearch: '',
  }

  return (
    <div className="flex items-center justify-center">
      <div className="mx-auto w-full max-w-screen-md px-4">
        <PlaceholderCustom xs={12} as="h1">
          <div className="text-center">
            <h1 className="page-header mb-0">{`${church?.name} ${churchType}`}</h1>
            <p className="menu-subheading">Receive Offering</p>
          </div>
        </PlaceholderCustom>

        <ApolloWrapper data={data} loading={loading} error={error}>
          <div>
            <Formik initialValues={initialValues} onSubmit={onSubmit}>
              {() => (
                <Form>
                  <Input
                    className="form-control church-search search-center"
                    name="defaulterSearch"
                    placeholder="Search Churches"
                    aria-describedby="Defaulter Search"
                  />
                </Form>
              )}
            </Formik>
            <div className="mb-3 mt-2 text-center">Week {getWeekNumber()}</div>
            <div className="grid gap-2">
              {isOpen && (
                <Popup handleClose={togglePopup}>
                  {governorshipServiceLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <h3 className="menu-subheading text-center">
                        {selected?.name} {selected?.__typename}
                      </h3>
                      <h6 className="text-center">Confirm Offering?</h6>
                      <Table className="border [&_td]:border [&_td]:border-border [&_tr:nth-child(even)]:bg-muted/40">
                        <TableBody>
                          <TableRow>
                            <TableCell>Income</TableCell>
                            <TableCell className="break-words">
                              {service?.income}
                            </TableCell>
                          </TableRow>
                          {service?.foreignCurrency && (
                            <TableRow>
                              <TableCell>Foreign Currency</TableCell>
                              <TableCell className="break-words">
                                {service?.foreignCurrency}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <i className="text-destructive">
                        NB: You must only click this button if the amount the
                        governorship is submitting is the same as what is
                        displayed here
                      </i>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
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
                            } catch (err: any) {
                              setSubmitting(false)
                              throwToSentry(err)
                            }
                          }}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Submitting</span>
                            </>
                          ) : (
                            `Yes, I'm sure`
                          )}
                        </Button>
                        <Button variant="outline" onClick={togglePopup}>
                          No, take me back
                        </Button>
                      </div>
                    </>
                  )}
                </Popup>
              )}
              {defaultersData?.map((defaulter: Defaulter, index: number) => (
                <Card key={index} className="confirm-banking-card mt-2">
                  <div className="flex items-center p-4">
                    <CloudinaryImage
                      className="img-search shrink-0 rounded-full"
                      src={defaulter?.leader?.pictureUrl}
                      alt={defaulter?.leader?.fullName}
                    />

                    <div className="ms-3 min-w-0 flex-1">
                      <h6 className="font-bold">{`${defaulter?.name} ${defaulter.__typename}`}</h6>
                      <p className="mb-0 text-sm text-muted-foreground">
                        <span>{defaulter?.leader?.fullName}</span>
                      </p>
                    </div>
                  </div>
                  <CardFooter className="justify-center pb-4">
                    <Button
                      disabled={governorshipServiceLoading}
                      variant="default"
                      className="bg-[hsl(var(--maps))] text-white hover:bg-[hsl(var(--maps))]/90"
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
                    >
                      {governorshipServiceLoading &&
                      index === defaulterIndex ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />{' '}
                          <span>Loading...</span>
                        </>
                      ) : (
                        'Confirm Offering'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {!bankingDefaultersList?.length && !loading && (
              <NoDataComponent text="There are no services to be confirmed" />
            )}
          </div>
        </ApolloWrapper>
      </div>
    </div>
  )
}
export default ConfirmAnagkazoBanking
