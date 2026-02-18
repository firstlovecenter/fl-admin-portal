import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { throwToSentry } from '../../../global-utils'
import { CREATE_OVERSIGHT_MUTATION } from './CreateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import OversightForm, {
  OversightFormValues,
} from 'pages/directory/reusable-forms/OversightForm'
import { FormikHelpers } from 'formik'

const CreateOversight = () => {
  const { clickCard, denominationId } = useContext(ChurchContext)

  const navigate = useNavigate()

  const initialValues: OversightFormValues = {
    name: '',
    leaderId: '',
    leaderName: '',
    leaderEmail: '',
    denomination: denominationId,
  }

  const [CreateOversight] = useMutation(CREATE_OVERSIGHT_MUTATION)

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: OversightFormValues,
    onSubmitProps: FormikHelpers<OversightFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps

    setSubmitting(true)
    try {
      if (!values.leaderEmail) {
        setSubmitting(false)
        throw new Error('Leader email is required')
      }

      const res = await CreateOversight({
        variables: {
          name: values.name,
          leaderId: values.leaderId,
          denominationId: values.denomination,
        },
      })

      clickCard(res.data.CreateOversight)
      setSubmitting(false)
      resetForm()
      navigate(`/oversight/displaydetails`)
    } catch (error: any) {
      setSubmitting(false)
      throwToSentry('There was an error creating oversight', error)
    }
  }

  return (
    <OversightForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title={`Create a New Oversight`}
      newOversight
    />
  )
}

export default CreateOversight
