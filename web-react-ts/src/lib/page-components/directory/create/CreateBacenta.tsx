import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { CREATE_BACENTA_MUTATION } from './CreateMutations'
import { ChurchContext } from '@/contexts/ChurchContext'
import { NEW_BACENTA_LEADER } from './MakeLeaderMutations'
import BacentaForm, { BacentaFormValues } from '../reusable-forms/BacentaForm'
import { throwToSentry } from 'global-utils'
import { FormikHelpers } from 'formik'

const CreateBacenta = () => {
  const { clickCard, governorshipId } = useContext(ChurchContext)
  const router = useRouter()

  const initialValues: BacentaFormValues = {
    name: '',
    leaderId: '',
    leaderName: '',
    leaderEmail: '',
    governorship: governorshipId ?? '',
    vacationStatus: '',
    meetingDay: 'Thursday',
    venueLatitude: '0.0',
    venueLongitude: '0.0',
  }

  const [NewBacentaLeader] = useMutation(NEW_BACENTA_LEADER)
  const [CreateBacenta] = useMutation(CREATE_BACENTA_MUTATION)

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: BacentaFormValues,
    onSubmitProps: FormikHelpers<BacentaFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    setSubmitting(true)

    try {
      if (!values.leaderEmail) {
        setSubmitting(false)
        throw new Error('Leader email is required')
      }

      const res = await CreateBacenta({
        variables: {
          name: values.name,
          governorshipId: values.governorship,
          leaderId: values.leaderId,
          meetingDay: values.meetingDay,
          venueLongitude: parseFloat(values.venueLongitude.toString()),
          venueLatitude: parseFloat(values.venueLatitude.toString()),
        },
      })

      await NewBacentaLeader({
        variables: {
          leaderId: values.leaderId,
          bacentaId: res.data.CreateBacenta.id,
        },
      })

      clickCard(res.data.CreateBacenta)
      setSubmitting(false)
      resetForm()
      router.push('/bacenta/displaydetails')
    } catch (error: any) {
      throwToSentry('There was an error creating bacenta', error)
      setSubmitting(false)
    }
  }

  return (
    <BacentaForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title="Start a New Bacenta"
      newBacenta
    />
  )
}

export default CreateBacenta
