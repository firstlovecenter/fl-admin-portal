import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { throwToSentry } from '../../../global-utils'
import { CREATE_HUB_MUTATION } from './CreateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { NEW_HUB_LEADER } from './MakeLeaderMutations'
import { FormikHelpers } from 'formik'
import HubForm, { HubFormValues } from '../reusable-forms/HubForm'

const CreateHub = () => {
  const { clickCard, hubCouncilId } = useContext(ChurchContext)

  const navigate = useNavigate()

  const initialValues: HubFormValues = {
    hubCouncil: hubCouncilId ?? '',
    governorship: '',
    leaderId: '',
    leaderName: '',
    leaderEmail: '',
    name: '',
    meetingDay: '',
    vacationStatus: 'Active',
    venueLatitude: '0.0',
    venueLongitude: '0.0',
  }

  const [NewHubLeader] = useMutation(NEW_HUB_LEADER)
  const [CreateHub] = useMutation(CREATE_HUB_MUTATION)

  const onSubmit = async (
    values: HubFormValues,
    onSubmitProps: FormikHelpers<HubFormValues>
  ) => {
    onSubmitProps.setSubmitting(true)

    try {
      if (!values.leaderEmail) {
        onSubmitProps.setSubmitting(false)
        throw new Error('Leader email is required')
      }

      const res = await CreateHub({
        variables: {
          hubCouncilId: values.hubCouncil,
          governorshipId: values.governorship,
          leaderId: values.leaderId,
          name: values.name,
          meetingDay: values.meetingDay,
          venueLongitude: parseFloat(values.venueLongitude.toString()),
          venueLatitude: parseFloat(values.venueLatitude.toString()),
        },
      })

      await NewHubLeader({
        variables: {
          leaderId: values.leaderId,
          hubId: res.data.CreateHub.id,
        },
      })

      clickCard({ id: values.hubCouncil, __typename: 'HubCouncil' })
      clickCard(res.data.CreateHub)
      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()
      navigate(`/hub/displaydetails`)
    } catch (error: unknown) {
      throwToSentry('There was an error creating hub', error)
    }
  }

  return (
    <HubForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title={`Create a New Hub`}
      newHub
    />
  )
}
export default CreateHub
