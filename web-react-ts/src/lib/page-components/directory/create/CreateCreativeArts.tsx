import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { throwToSentry } from '@/global-utils'
import { CREATE_CREATIVEARTS_MUTATION } from './CreateMutations'
import { ChurchContext } from '@/contexts/ChurchContext'
import { NEW_CREATIVEARTS_LEADER } from './MakeLeaderMutations'
import { FormikHelpers } from 'formik'
import CreativeArtsForm, {
  CreativeArtsFormValues,
} from '../reusable-forms/CreativeArtsForm'

const CreateCreativeArts = () => {
  const { clickCard, campusId } = useContext(ChurchContext)

  const router = useRouter()

  const initialValues: CreativeArtsFormValues = {
    leaderId: '',
    leaderName: '',
    leaderEmail: '',
    name: '',
    campus: campusId ?? '',
  }

  const [NewCreativeArtsLeader] = useMutation(NEW_CREATIVEARTS_LEADER)
  const [CreateCreativeArts] = useMutation(CREATE_CREATIVEARTS_MUTATION)

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: CreativeArtsFormValues,
    onSubmitProps: FormikHelpers<CreativeArtsFormValues>
  ) => {
    try {
      onSubmitProps.setSubmitting(true)

      if (!values.leaderEmail) {
        throw new Error('Leader email is required')
      }

      const res = await CreateCreativeArts({
        variables: {
          campusId: values.campus,
          leaderId: values.leaderId,
          name: values.name,
        },
      })

      await NewCreativeArtsLeader({
        variables: {
          leaderId: values.leaderId,
          creativeArtsId: res.data.CreateCreativeArts.id,
        },
      })

      clickCard({
        id: values.campus,
        __typename: 'Campus',
      })
      clickCard(res.data.CreateCreativeArts)
      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()
      router.push(`/creativearts/displaydetails`)
    } catch (error: unknown) {
      throwToSentry('There was an error creating Creative Arts', error)
    }
  }

  return (
    <CreativeArtsForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title="Create a New Creative Arts"
      newCreativeArts
    />
  )
}
export default CreateCreativeArts
