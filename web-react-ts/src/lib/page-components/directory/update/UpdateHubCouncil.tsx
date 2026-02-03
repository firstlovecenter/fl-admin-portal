import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, throwToSentry } from '@/global-utils'
import { ChurchContext } from '@/contexts/ChurchContext'
import { DISPLAY_HUBCOUNCIL } from '../display/ReadQueries'
import { LOG_HUBCOUNCIL_HISTORY } from './LogMutations'
import HubCouncilForm, {
  HubCouncilFormValues,
} from 'pages/directory/reusable-forms/HubCouncilForm'
import { FormikHelpers } from 'formik'
import LoadingScreen from 'components/base-component/LoadingScreen'
import { UPDATE_HUBCOUNCIL_MUTATION } from './UpdateSontaMutations'
import { MAKE_HUBCOUNCIL_LEADER } from './ChangeLeaderMutations'
import { GET_MINISTRY_HUBCOUNCILS } from '../reusable-forms/SontaListQueries'

const UpdateHubCouncil = () => {
  const { hubCouncilId } = useContext(ChurchContext)
  const { data, loading } = useQuery(DISPLAY_HUBCOUNCIL, {
    variables: { id: hubCouncilId },
  })

  const router = useRouter()
  const hubCouncil = data?.hubCouncils[0]

  const initialValues: HubCouncilFormValues = {
    name: hubCouncil?.name,
    council: hubCouncil?.council.name,
    leaderName: hubCouncil?.leader?.fullName ?? '',
    leaderId: hubCouncil?.leader?.id || '',
    leaderEmail: hubCouncil?.leader?.email || '',
    hubs: hubCouncil?.hubs,
  }

  const [LogHubCouncilHistory] = useMutation(LOG_HUBCOUNCIL_HISTORY, {
    refetchQueries: [
      {
        query: DISPLAY_HUBCOUNCIL,
        variables: { id: hubCouncilId },
      },
    ],
  })

  const [MakeHubCouncilLeader] = useMutation(MAKE_HUBCOUNCIL_LEADER)
  const [UpdateHubCouncil] = useMutation(UPDATE_HUBCOUNCIL_MUTATION, {
    refetchQueries: [
      {
        query: GET_MINISTRY_HUBCOUNCILS,
        variables: { id: hubCouncil?.ministry.id },
      },
    ],
  })

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: HubCouncilFormValues,
    onSubmitProps: FormikHelpers<HubCouncilFormValues>
  ) => {
    onSubmitProps.setSubmitting(true)

    try {
      await UpdateHubCouncil({
        variables: {
          hubCouncilId,
          name: values.name,
        },
      })

      //Log if HubCouncil Name Changes
      if (values.name !== initialValues.name) {
        await LogHubCouncilHistory({
          variables: {
            hubCouncilId,
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
          await MakeHubCouncilLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              hubCouncilId,
            },
          })
          alertMsg('Leader Changed Successfully')
          router.push(`/hubCouncil/displaydetails`)
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
      router.push(`/hubCouncil/displaydetails`)
    } catch (err: any) {
      throwToSentry('There was a problem updating this hubCouncil', err)
      onSubmitProps.setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <HubCouncilForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title="Update HubCouncil Form"
      newHubCouncil={false}
    />
  )
}

export default UpdateHubCouncil
