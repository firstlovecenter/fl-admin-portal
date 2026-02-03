import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, throwToSentry } from '@/global-utils'
import { GET_CREATIVEARTS_MINISTRIES } from '@/queries/ListQueries'
import { ChurchContext } from '@/contexts/ChurchContext'
import { DISPLAY_MINISTRY } from '../display/ReadQueries'
import { LOG_MINISTRY_HISTORY } from './LogMutations'
import MinistryForm, {
  MinistryFormValues,
} from 'pages/directory/reusable-forms/MinistryForm'
import { FormikHelpers } from 'formik'
import LoadingScreen from 'components/base-component/LoadingScreen'
import { UPDATE_MINISTRY_MUTATION } from './UpdateSontaMutations'
import { MAKE_MINISTRY_LEADER } from './ChangeLeaderMutations'

const UpdateMinistry = () => {
  const { ministryId } = useContext(ChurchContext)
  const { data, loading } = useQuery(DISPLAY_MINISTRY, {
    variables: { id: ministryId },
  })

  const router = useRouter()
  const ministry = data?.ministries[0]

  const initialValues: MinistryFormValues = {
    name: ministry?.name,
    leaderName: ministry?.leader?.fullName ?? '',
    adminId: ministry?.admin?.id || '',
    leaderId: ministry?.leader?.id || '',
    leaderEmail: ministry?.leader?.email || '',
    hubCouncils: ministry?.hubCouncils,
    bankAccount: ministry?.bankAccount || '',
  }
  const [LogMinistryHistory] = useMutation(LOG_MINISTRY_HISTORY, {
    refetchQueries: [
      {
        query: DISPLAY_MINISTRY,
        variables: { id: ministryId },
      },
    ],
  })

  const [MakeMinistryLeader] = useMutation(MAKE_MINISTRY_LEADER)
  const [UpdateMinistry] = useMutation(UPDATE_MINISTRY_MUTATION, {
    refetchQueries: [
      {
        query: GET_CREATIVEARTS_MINISTRIES,
        variables: { id: ministry?.creativeArts.id },
      },
    ],
  })

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: MinistryFormValues,
    onSubmitProps: FormikHelpers<MinistryFormValues>
  ) => {
    onSubmitProps.setSubmitting(true)

    try {
      await UpdateMinistry({
        variables: {
          ministryId,
          name: values.name,
          bankAccount: values.bankAccount,
        },
      })

      //Log if Ministry Name Changes
      if (values.name !== initialValues.name) {
        await LogMinistryHistory({
          variables: {
            ministryId,
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
          await MakeMinistryLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              ministryId,
            },
          })
          alertMsg('Leader Changed Successfully')
          router.push(`/ministry/displaydetails`)
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
      router.push(`/ministry/displaydetails`)
    } catch (err: any) {
      throwToSentry('There was a problem updating this ministry', err)
      onSubmitProps.setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <MinistryForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title="Update Ministry Form"
      newMinistry={false}
    />
  )
}

export default UpdateMinistry
