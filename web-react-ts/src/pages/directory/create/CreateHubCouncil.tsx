import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { throwToSentry } from '../../../global-utils'
import { CREATE_HUBCOUNCIL_MUTATION } from './CreateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { NEW_HUBCOUNCIL_LEADER } from './MakeLeaderMutations'
import { FormikHelpers } from 'formik'
import HubCouncilForm, {
  HubCouncilFormValues,
} from '../reusable-forms/HubCouncilForm'

const CreateHubCouncil = () => {
  const { clickCard, ministryId, councilId } = useContext(ChurchContext)

  const navigate = useNavigate()

  const initialValues: HubCouncilFormValues = {
    ministry: ministryId,
    council: councilId ?? '',
    leaderId: '',
    leaderName: '',
    leaderEmail: '',
    name: '',
  }

  const [NewHubCouncilLeader] = useMutation(NEW_HUBCOUNCIL_LEADER)
  const [CreateHubCouncil] = useMutation(CREATE_HUBCOUNCIL_MUTATION)

  const onSubmit = async (
    values: HubCouncilFormValues,
    onSubmitProps: FormikHelpers<HubCouncilFormValues>
  ) => {
    onSubmitProps.setSubmitting(true)

    try {
      if (!values.leaderEmail) {
        onSubmitProps.setSubmitting(false)
        throw new Error('Leader email is required')
      }

      const res = await CreateHubCouncil({
        variables: {
          ministryId: values.ministry,
          councilId: values.council,
          leaderId: values.leaderId,
        },
      })

      await NewHubCouncilLeader({
        variables: {
          leaderId: values.leaderId,
          hubCouncilId: res.data.CreateHubCouncil.id,
        },
      })

      clickCard({ id: values.ministry, __typename: 'Ministry' })
      clickCard(res.data.CreateHubCouncil)
      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()
      navigate(`/hubCouncil/displaydetails`)
    } catch (error: unknown) {
      throwToSentry('There was an error creating hubCouncil', error)
    }
  }

  return (
    <HubCouncilForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title={`Create a New HubCouncil`}
      newHubCouncil
    />
  )
}
export default CreateHubCouncil
