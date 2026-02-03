import { useMutation, useQuery } from '@apollo/client'
import React, { useContext } from 'react'
import { Button, Container, Spinner } from 'react-bootstrap'
import {
  SET_FELLOWSHIP_TO_HUB_FELLOWSHIP,
  SET_HUB_FELLOWSHIP_TO_REGULAR_FELLOWSHIP,
} from '../update/StatusChanges'
import { ChurchContext } from 'contexts/ChurchContext'
import { DISPLAY_FELLOWSHIP } from '../display/ReadQueries'
import { useRouter } from 'next/navigation'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import HeadingSecondary from 'components/HeadingSecondary'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Form, Formik, FormikHelpers } from 'formik'
import { throwToSentry } from 'global-utils'
import SubmitButton from 'components/formik/SubmitButton'
import SearchHub from 'components/formik/SearchHub'
import { Church } from '@jaedag/admin-portal-types'

const MakeHubFellowship = () => {
  const { clickCard, fellowshipId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_FELLOWSHIP, {
    variables: { id: fellowshipId },
  })

  const [MakeHubFellowship] = useMutation(SET_FELLOWSHIP_TO_HUB_FELLOWSHIP)
  const [RemoveHubFellowship] = useMutation(
    SET_HUB_FELLOWSHIP_TO_REGULAR_FELLOWSHIP
  )

  const router = useRouter()
  const fellowship = data?.fellowships[0]

  const initialValues: {
    hub: Church
    fellowship: string
  } = {
    hub: {} as Church,
    fellowship: fellowshipId,
  }

  const handleMakeHubFellowship = async (
    values: typeof initialValues,
    onSubmitProps: FormikHelpers<typeof initialValues>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      await MakeHubFellowship({
        variables: {
          fellowshipId,
          hubId: values.hub.id,
        },
      })
      clickCard(fellowshipId)
      router.push('/fellowship/displaydetails')
    } catch (error) {
      throwToSentry('Error Making Hub Fellowship ', error)
    } finally {
      onSubmitProps.setSubmitting(false)
    }
  }

  const handleRemoveHubFellowship = async () => {
    setBtnLoading(true)
    try {
      await RemoveHubFellowship({
        variables: {
          fellowshipId,
        },
      })
      clickCard(fellowshipId)
      router.push('/fellowship/displaydetails')
    } catch (error) {
      throwToSentry('Error Removing Hub Fellowship ', error)
    } finally {
      setBtnLoading(false)
    }
  }
  const [btnLoading, setBtnLoading] = React.useState(false)

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>Change Hub Fellowship Status</HeadingPrimary>
        <HeadingSecondary>{`${fellowship?.name} ${fellowship?.__typename}`}</HeadingSecondary>

        {fellowship?.hubStatus && (
          <Container>
            <div>Remove Hub Fellowship Status</div>
            <Button
              className="my-4"
              disabled={btnLoading}
              onClick={handleRemoveHubFellowship}
            >
              {btnLoading ? (
                <Spinner size="sm" />
              ) : (
                `Remove Hub Fellowship Status`
              )}
            </Button>
          </Container>
        )}
        {!fellowship?.hubStatus && (
          <Formik
            initialValues={initialValues}
            onSubmit={handleMakeHubFellowship}
          >
            {(formik) => (
              <Form>
                <SearchHub
                  name="hub"
                  label="Hub"
                  placeholder="Search for Hub"
                  setFieldValue={formik.setFieldValue}
                />
                <SubmitButton formik={formik} />
              </Form>
            )}
          </Formik>
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default MakeHubFellowship
