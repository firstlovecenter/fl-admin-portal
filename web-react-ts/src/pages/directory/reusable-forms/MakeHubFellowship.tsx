import { useMutation, useQuery } from '@apollo/client'
import React, { useContext } from 'react'
import {
  SET_FELLOWSHIP_TO_HUB_FELLOWSHIP,
  SET_HUB_FELLOWSHIP_TO_REGULAR_FELLOWSHIP,
} from '../update/StatusChanges'
import { ChurchContext } from 'contexts/ChurchContext'
import { DISPLAY_FELLOWSHIP } from '../display/ReadQueries'
import { useNavigate } from 'react-router'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import HeadingSecondary from 'components/HeadingSecondary'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Form, Formik, FormikHelpers } from 'formik'
import { throwToSentry } from 'global-utils'
import SubmitButton from 'components/formik/SubmitButton'
import SearchHub from 'components/formik/SearchHub'
import { Church } from '@jaedag/admin-portal-types'
import { Button } from 'components/ui/button'
import { Loader2 } from 'lucide-react'

const MakeHubFellowship = () => {
  const { clickCard, fellowshipId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_FELLOWSHIP, {
    variables: { id: fellowshipId },
  })

  const [MakeHubFellowship] = useMutation(SET_FELLOWSHIP_TO_HUB_FELLOWSHIP)
  const [RemoveHubFellowship] = useMutation(
    SET_HUB_FELLOWSHIP_TO_REGULAR_FELLOWSHIP
  )

  const navigate = useNavigate()
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
          fellowshipId: fellowshipId,
          hubId: values.hub.id,
        },
      })
      clickCard(fellowshipId)
      navigate('/fellowship/displaydetails')
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
      navigate('/fellowship/displaydetails')
    } catch (error) {
      throwToSentry('Error Removing Hub Fellowship ', error)
    } finally {
      setBtnLoading(false)
    }
  }
  const [btnLoading, setBtnLoading] = React.useState(false)

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div>
        <HeadingPrimary>Change Hub Fellowship Status</HeadingPrimary>
        <HeadingSecondary>{`${fellowship?.name} ${fellowship?.__typename}`}</HeadingSecondary>

        {fellowship?.hubStatus && (
          <div>
            <div>Remove Hub Fellowship Status</div>
            <Button
              className="my-4"
              disabled={btnLoading}
              onClick={handleRemoveHubFellowship}
            >
              {btnLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `Remove Hub Fellowship Status`
              )}
            </Button>
          </div>
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
      </div>
    </ApolloWrapper>
  )
}

export default MakeHubFellowship
