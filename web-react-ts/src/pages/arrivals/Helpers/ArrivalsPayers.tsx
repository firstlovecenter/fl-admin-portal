import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { FunctionReturnsVoid, Member, Council } from 'global-types'
import React, { useContext, useState } from 'react'
import * as Yup from 'yup'
import { Form, Formik, FormikHelpers } from 'formik'
import { alertMsg, throwToSentry } from 'global-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import SearchMember from 'components/formik/SearchMember'
import ModalSubmitButton from 'pages/services/banking/anagkazo/ModalSubmitButton'
import { Loader2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import {
  MAKE_COUNCIL_ARRIVALSPAYER,
  REMOVE_COUNCIL_ARRIVALSPAYER,
  COUNCIL_ARRIVALSPAYERS,
} from './ArrivalsHelpersGQL'
import './ArrivalsHelpers.css'

interface CouncilWithArrivalsPayers extends Council {
  arrivalsPayers: Member[]
  activeBacentaCount: number
}

type FormOptions = {
  arrivalsPayerName: string
  arrivalsPayerSelect: string
}

const ArrivalsPayerSelect = () => {
  const { councilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(COUNCIL_ARRIVALSPAYERS, {
    variables: { id: councilId },
  })
  const [submitting, setSubmitting] = useState(false)
  const [show, setShow] = useState(false)
  const handleOpen: FunctionReturnsVoid = () => setShow(true)
  const handleClose: FunctionReturnsVoid = () => setShow(false)

  const council: CouncilWithArrivalsPayers = data?.councils[0]

  const [MakeCouncilArrivalsPayer] = useMutation(MAKE_COUNCIL_ARRIVALSPAYER, {
    refetchQueries: [
      {
        query: COUNCIL_ARRIVALSPAYERS,
        variables: { id: councilId },
      },
    ],
  })

  const [RemoveCouncilArrivalsPayer] = useMutation(
    REMOVE_COUNCIL_ARRIVALSPAYER,
    {
      refetchQueries: [
        {
          query: COUNCIL_ARRIVALSPAYERS,
          variables: { id: councilId },
        },
      ],
    }
  )

  const initialValues: FormOptions = {
    arrivalsPayerName: '',
    arrivalsPayerSelect: '',
  }

  const validationSchema = Yup.object({
    arrivalsPayerSelect: Yup.string().required(
      'Please select a arrivals payment governorship member from the dropdown'
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await MakeCouncilArrivalsPayer({
        variables: {
          councilId,
          arrivalsPayerId: values.arrivalsPayerSelect,
        },
      })

      handleClose()
      onSubmitProps.setSubmitting(false)
      alertMsg(
        'Arrivals Payment Governorship Member has been added successfully!'
      )
    } catch (e: any) {
      onSubmitProps.setSubmitting(false)
      throwToSentry(e)
    }
    onSubmitProps.setSubmitting(false)
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <HeadingPrimary>{`Select ${council?.name} Council Arrivals Payment Governorship Members`}</HeadingPrimary>
        <HeadingSecondary>
          Use the buttons below to choose Arrivals Payment Governorship Members
        </HeadingSecondary>
        <div>{`Number of Active Bacentas: ${council?.activeBacentaCount}`}</div>

        <Dialog
          open={show}
          onOpenChange={(open) => (open ? handleOpen() : handleClose())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Choose an Arrivals Payment Governorship Member
              </DialogTitle>
            </DialogHeader>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
            >
              {(formik) => (
                <Form>
                  <div className="form-row">
                    <SearchMember
                      name="arrivalsPayerSelect"
                      initialValue={initialValues?.arrivalsPayerName}
                      placeholder="Select a Name"
                      setFieldValue={formik.setFieldValue}
                      aria-describedby="Member Search"
                      error={formik.errors.arrivalsPayerSelect}
                    />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      Close
                    </Button>
                    <ModalSubmitButton
                      formik={formik}
                      onClick={handleClose}
                    />
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>

        <div className="mt-5 grid gap-2">
          <Button
            onClick={handleOpen}
            className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
          >
            Choose Arrivals Payment Governorship Members
          </Button>
        </div>

        {council?.arrivalsPayers?.map((arrivalsPayer: Member) => (
          <div key={arrivalsPayer.id} className="space-y-2">
            <MemberDisplayCard member={arrivalsPayer} />
            <div className="grid gap-2">
              <Button
                disabled={submitting}
                variant="destructive"
                onClick={async () => {
                  const confirmBox = window.confirm(
                    `Do you want to delete ${arrivalsPayer.fullName} as a arrivalsPayer`
                  )

                  if (confirmBox === true) {
                    setSubmitting(true)
                    try {
                      await RemoveCouncilArrivalsPayer({
                        variables: {
                          councilId,
                          arrivalsPayerId: arrivalsPayer.id,
                        },
                      })
                      setSubmitting(false)
                      alertMsg(`${arrivalsPayer.fullName} Deleted Successfully`)
                    } catch (error: any) {
                      throwToSentry('', error)
                    }
                  }
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting</span>
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        ))}

        {!council?.arrivalsPayers?.length && (
          <NoDataComponent text="You have no Arrivals Payment Governorship Members at this time" />
        )}
      </div>
    </ApolloWrapper>
  )
}

export default ArrivalsPayerSelect
