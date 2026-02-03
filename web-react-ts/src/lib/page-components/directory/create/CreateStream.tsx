import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { throwToSentry } from '@/global-utils'
import { CREATE_STREAM_MUTATION } from './CreateMutations'
import { ChurchContext } from '@/contexts/ChurchContext'
import { NEW_STREAM_LEADER } from './MakeLeaderMutations'
import StreamForm, {
  StreamFormValues,
} from 'pages/directory/reusable-forms/StreamForm'
import { FormikHelpers } from 'formik'

const CreateStream = () => {
  const { clickCard, campusId } = useContext(ChurchContext)

  const router = useRouter()

  const initialValues: StreamFormValues = {
    name: '',
    leaderId: '',
    meetingDay: 'Sunday',
    leaderName: '',
    bankAccount: 'manual',
    vacationStatus: 'Active',
    leaderEmail: '',
    campus: campusId,
  }

  const [NewStreamLeader] = useMutation(NEW_STREAM_LEADER)
  const [CreateStream] = useMutation(CREATE_STREAM_MUTATION)

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: StreamFormValues,
    onSubmitProps: FormikHelpers<StreamFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    try {
      setSubmitting(true)

      if (!values.leaderEmail) {
        setSubmitting(false)
        throw new Error('Leader email is required')
      }

      const res = await CreateStream({
        variables: {
          name: values.name,
          leaderId: values.leaderId,
          bankAccount: values.bankAccount,
          campusId: values.campus,
          meetingDay: values.meetingDay,
        },
      })

      await NewStreamLeader({
        variables: {
          leaderId: values.leaderId,
          streamId: res.data.CreateStream.id,
        },
      })

      clickCard(res.data.CreateStream)
      setSubmitting(false)
      resetForm()
      router.push(`/stream/displaydetails`)
    } catch (error) {
      throwToSentry('There was an error creating stream', error)
      setSubmitting(false)
    }
  }

  return (
    <StreamForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title="Create a New Stream"
      newStream
    />
  )
}

export default CreateStream
