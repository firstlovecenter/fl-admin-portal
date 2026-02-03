import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, throwToSentry } from '@/global-utils'
import { GET_CAMPUS_CREATIVEARTS } from '@/queries/ListQueries'
import { ChurchContext } from '@/contexts/ChurchContext'
import { DISPLAY_CREATIVEARTS } from '../display/ReadQueries'
import { LOG_CREATIVEARTS_HISTORY } from './LogMutations'
import CreativeArtsForm, {
  CreativeArtsFormValues,
} from 'pages/directory/reusable-forms/CreativeArtsForm'
import { FormikHelpers } from 'formik'
import LoadingScreen from 'components/base-component/LoadingScreen'
import { UPDATE_CREATIVEARTS_MUTATION } from './UpdateSontaMutations'
import { MAKE_CREATIVEARTS_LEADER } from './ChangeLeaderMutations'

const UpdateCreativeArts = () => {
  const { creativeArtsId } = useContext(ChurchContext)
  const { data, loading } = useQuery(DISPLAY_CREATIVEARTS, {
    variables: { id: creativeArtsId },
  })

  const router = useRouter()
  const creativeArts = data?.creativeArts[0]

  const initialValues: CreativeArtsFormValues = {
    name: creativeArts?.name,
    leaderName: creativeArts?.leader?.fullName ?? '',
    adminId: creativeArts?.admin?.id || '',
    leaderId: creativeArts?.leader?.id || '',
    leaderEmail: creativeArts?.leader?.email || '',
    ministries: creativeArts?.ministries,
  }
  const [LogCreativeArtsHistory] = useMutation(LOG_CREATIVEARTS_HISTORY, {
    refetchQueries: [
      {
        query: DISPLAY_CREATIVEARTS,
        variables: { id: creativeArtsId },
      },
    ],
  })

  const [MakeCreativeArtsLeader] = useMutation(MAKE_CREATIVEARTS_LEADER)
  const [UpdateCreativeArts] = useMutation(UPDATE_CREATIVEARTS_MUTATION, {
    refetchQueries: [
      {
        query: GET_CAMPUS_CREATIVEARTS,
        variables: { id: creativeArts?.campus.id },
      },
    ],
  })

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: CreativeArtsFormValues,
    onSubmitProps: FormikHelpers<CreativeArtsFormValues>
  ) => {
    onSubmitProps.setSubmitting(true)

    try {
      await UpdateCreativeArts({
        variables: {
          creativeArtsId,
          name: values.name,
        },
      })

      //Log if CreativeArts Name Changes
      if (values.name !== initialValues.name) {
        await LogCreativeArtsHistory({
          variables: {
            creativeArtsId,
            newLeaderId: '',
            oldLeaderId: '',
            oldOversightId: '',
            newOversightId: '',
            historyRecord: `Creative Arts name has been changed from ${initialValues.name} to ${values.name}`,
          },
        })
      }

      //Log if the Leader Changes
      if (values.leaderId !== initialValues.leaderId) {
        try {
          await MakeCreativeArtsLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              creativeArtsId,
            },
          })
          alertMsg('Leader Changed Successfully')
          router.push(`/creativeArts/displaydetails`)
        } catch (err: any) {
          const errorArray = err.toString().replace('Error: ', '').split('\n')
          if (errorArray[0] === errorArray[1]) {
            throwToSentry(
              'There was a problem changing the leader',
              errorArray[0]
            )
          } else {
            throwToSentry('There was a problem changing the leader', err)
          }
        }
      }
      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()
      router.push(`/creativeArts/displaydetails`)
    } catch (err: any) {
      throwToSentry('There was a problem updating this creativeArts', err)
      onSubmitProps.setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <CreativeArtsForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title="Update CreativeArts Form"
      newCreativeArts={false}
    />
  )
}

export default UpdateCreativeArts
