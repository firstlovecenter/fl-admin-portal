import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext, useState } from 'react'
import { Button, Col, Container, Row, Spinner } from 'react-bootstrap'
import * as Yup from 'yup'
import { Form, Formik, FormikHelpers } from 'formik'
import {
  MAKE_STREAMARRIVALS_COUNTER,
  REMOVE_STREAMARRIVALS_COUNTER,
  STREAM_ARRIVALS_HELPERS,
} from './ArrivalsHelpersGQL'
import { alertMsg, throwToSentry } from 'global-utils'
import Popup from 'components/Popup/Popup'
import SubmitButton from 'components/formik/SubmitButton'
import NoData from '../CompNoData'
import usePopup from 'hooks/usePopup'
import { StreamWithArrivals } from '../arrivals-types'
import SearchMember from 'components/formik/SearchMember'

type FormOptions = {
  helperName: string
  helperSelect: string
}

const ArrivalsCounters = () => {
  const { streamId } = useContext(ChurchContext)
  const { isOpen, togglePopup } = usePopup()
  const [submitting, setSubmitting] = useState(false)

  const { data, loading, error } = useQuery(STREAM_ARRIVALS_HELPERS, {
    variables: { id: streamId },
  })
  const stream: StreamWithArrivals = data?.streams[0]

  const [MakeStreamArrivalsCounter] = useMutation(MAKE_STREAMARRIVALS_COUNTER, {
    refetchQueries: [
      {
        query: STREAM_ARRIVALS_HELPERS,
        variables: { id: streamId },
      },
    ],
  })

  const [RemoveStreamArrivalsCounter] = useMutation(
    REMOVE_STREAMARRIVALS_COUNTER,
    {
      refetchQueries: [
        {
          query: STREAM_ARRIVALS_HELPERS,
          variables: { id: streamId },
        },
      ],
    }
  )

  const initialValues: FormOptions = {
    helperName: '',
    helperSelect: '',
  }

  const validationSchema = Yup.object({
    helperSelect: Yup.string().required(
      'Please select a helper from the dropdown'
    ),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await MakeStreamArrivalsCounter({
        variables: {
          streamId: streamId,
          arrivalsCounterId: values.helperSelect,
        },
      })

      togglePopup()
      onSubmitProps.setSubmitting(false)
      alert('Arrivals Counter has been added successfully')
    } catch (e: any) {
      onSubmitProps.setSubmitting(false)
      throwToSentry(e)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>{`${stream?.name} Arrivals Counters`}</HeadingPrimary>
        {isOpen && (
          <Popup handleClose={togglePopup}>
            <b>Add Arrivals Helper</b>
            <p>Please enter the name of the new arrivals rep</p>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
            >
              {(formik) => (
                <Form>
                  <Row className="form-row">
                    <Col>
                      <SearchMember
                        name="helperSelect"
                        initialValue={initialValues?.helperName}
                        placeholder="Select a Name"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Member Search"
                        error={formik.errors.helperSelect}
                      />
                    </Col>
                  </Row>

                  <SubmitButton formik={formik} />
                </Form>
              )}
            </Formik>
          </Popup>
        )}

        <Button onClick={() => togglePopup()}>Add Helpers</Button>

        {stream?.arrivalsCounters.map((counter, i) => (
          <div key={i}>
            <MemberDisplayCard key={i} member={counter} />
            <Button
              disabled={submitting}
              onClick={async () => {
                const confirmBox = window.confirm(
                  `Do you want to remove ${counter.fullName} as a counter`
                )

                if (confirmBox === true) {
                  setSubmitting(true)
                  try {
                    await RemoveStreamArrivalsCounter({
                      variables: {
                        streamId: streamId,
                        arrivalsCounterId: counter.id,
                      },
                    })
                    setSubmitting(false)
                    alertMsg(`${counter.fullName} Removed Successfully`)
                  } catch (error: any) {
                    throwToSentry(error)
                  }
                }
              }}
            >
              {submitting ? (
                <>
                  <Spinner animation="grow" size="sm" />
                  <span> Submitting</span>
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </div>
        ))}

        {!stream?.arrivalsCounters.length && (
          <NoData text="There are no arrivals helpers" />
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default ArrivalsCounters
