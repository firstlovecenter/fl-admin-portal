import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { FunctionReturnsVoid, Member, Stream } from 'global-types'
import React, { useContext, useState } from 'react'
import * as Yup from 'yup'
import { Form, Formik, FormikHelpers } from 'formik'
import { alertMsg, throwToSentry } from 'global-utils'
import NoDataComponent from 'pages/arrivals/CompNoData'
import SearchMember from 'components/formik/SearchMember'
import { Loader2 } from 'lucide-react'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import ModalSubmitButton from './ModalSubmitButton'
import {
  MAKE_STREAM_TELLER,
  REMOVE_STREAM_TELLER,
  STREAM_BANK_TELLERS,
} from './Treasury.gql'
import './TellerSelect.css'

interface StreamWithTellers extends Stream {
  tellers: Member[]
  activeBacentaCount: number
}

type FormOptions = {
  tellerName: string
  tellerSelect: string
}

const TellerSelect = () => {
  const { streamId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(STREAM_BANK_TELLERS, {
    variables: { id: streamId },
  })
  const [submitting, setSubmitting] = useState(false)
  const [show, setShow] = useState(false)
  const handleOpen: FunctionReturnsVoid = () => setShow(true)
  const handleClose: FunctionReturnsVoid = () => setShow(false)

  const stream: StreamWithTellers = data?.streams[0]

  const [MakeStreamTeller] = useMutation(MAKE_STREAM_TELLER, {
    refetchQueries: [
      {
        query: STREAM_BANK_TELLERS,
        variables: { id: streamId },
      },
    ],
  })

  const [RemoveStreamTeller] = useMutation(REMOVE_STREAM_TELLER, {
    refetchQueries: [
      {
        query: STREAM_BANK_TELLERS,
        variables: { id: streamId },
      },
    ],
  })

  const initialValues: FormOptions = {
    tellerName: '',
    tellerSelect: '',
  }

  const validationSchema = Yup.object({
    tellerSelect: Yup.string().required(
      'Please select a teller from the dropdown'
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await MakeStreamTeller({
        variables: {
          streamId,
          tellerId: values.tellerSelect,
        },
      })

      handleClose()
      onSubmitProps.setSubmitting(false)
      alertMsg('Stream Teller has been added successfully')
    } catch (e: any) {
      onSubmitProps.setSubmitting(false)
      throwToSentry(e)
    }
    onSubmitProps.setSubmitting(false)
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="mx-auto w-full max-w-screen-md space-y-4 px-4">
        <HeadingPrimary>{`Select ${stream?.name} Tellers`}</HeadingPrimary>
        <HeadingSecondary>
          Use the buttons below to choose tellers
        </HeadingSecondary>
        <div>{`Number of Active Bacentas: ${stream?.activeBacentaCount}`}</div>

        <Dialog
          open={show}
          onOpenChange={(open) => (open ? handleOpen() : handleClose())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose a Treasurer</DialogTitle>
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
                      name="tellerSelect"
                      initialValue={initialValues?.tellerName}
                      placeholder="Select a Name"
                      setFieldValue={formik.setFieldValue}
                      aria-describedby="Member Search"
                      error={formik.errors.tellerSelect}
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
                    <ModalSubmitButton formik={formik} onClick={handleClose} />
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>

        <div className="mt-5 grid gap-2">
          <Button
            size="lg"
            onClick={handleOpen}
            className="bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90"
          >
            Choose Treasurers
          </Button>
        </div>

        {stream?.tellers?.map((teller: Member) => (
          <div key={teller.id} className="space-y-2">
            <MemberDisplayCard member={teller} />
            <div className="grid gap-2">
              <Button
                disabled={submitting}
                variant="destructive"
                onClick={async () => {
                  const confirmBox = window.confirm(
                    `Do you want to delete ${teller.fullName} as a teller`
                  )

                  if (confirmBox === true) {
                    setSubmitting(true)
                    try {
                      await RemoveStreamTeller({
                        variables: {
                          streamId,
                          tellerId: teller.id,
                        },
                      })
                      setSubmitting(false)
                      alertMsg(`${teller.fullName} Deleted Successfully`)
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

        {!stream?.tellers?.length && (
          <NoDataComponent text="You have no Bank Tellers at this time" />
        )}
      </div>
    </ApolloWrapper>
  )
}

export default TellerSelect
