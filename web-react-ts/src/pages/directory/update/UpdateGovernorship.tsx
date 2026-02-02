import { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, throwToSentry } from '../../../global-utils'
import { UPDATE_GOVERNORSHIP_MUTATION } from './UpdateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { DISPLAY_GOVERNORSHIP } from '../display/ReadQueries'
import { LOG_GOVERNORSHIP_HISTORY } from './LogMutations'
import { MAKE_GOVERNORSHIP_LEADER } from './ChangeLeaderMutations'
import GovernorshipForm, {
  GovernorshipFormValues,
} from 'pages/directory/reusable-forms/GovernorshipForm'
import { FormikHelpers } from 'formik'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const UpdateGovernorship = () => {
  const { governorshipId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_GOVERNORSHIP, {
    variables: { id: governorshipId },
  })

  const router = useRouter()
  const governorship = data?.governorships[0]
  const initialValues: GovernorshipFormValues = {
    name: governorship?.name,
    leaderName:
      governorship?.leader?.firstName + ' ' + governorship?.leader?.lastName ??
      '',
    adminId: governorship?.admin?.id || '',
    leaderId: governorship?.leader?.id || '',
    leaderEmail: governorship?.leader?.email || '',
    council: governorship?.council,
    bacentas: governorship?.bacentas?.length ? governorship.bacentas : [''],
    hubs: governorship?.hubs?.length ? governorship.hubs : [''],
  }
  const [LogGovernorshipHistory] = useMutation(LOG_GOVERNORSHIP_HISTORY, {
    refetchQueries: [
      { query: DISPLAY_GOVERNORSHIP, variables: { id: governorshipId } },
    ],
  })

  const [MakeGovernorshipLeader] = useMutation(MAKE_GOVERNORSHIP_LEADER)
  const [UpdateGovernorship] = useMutation(UPDATE_GOVERNORSHIP_MUTATION)
  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: GovernorshipFormValues,
    onSubmitProps: FormikHelpers<GovernorshipFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    setSubmitting(true)

    try {
      await UpdateGovernorship({
        variables: {
          governorshipId: governorshipId,
          name: values.name,
        },
      })
      //Log if Governorship Name Changes
      if (values.name !== initialValues.name) {
        await LogGovernorshipHistory({
          variables: {
            governorshipId: governorshipId,
            newLeaderId: '',
            oldLeaderId: '',
            oldCouncilId: '',
            newCouncilId: '',
            historyRecord: `Governorship name has been changed from ${initialValues.name} to ${values.name}`,
          },
        })
      }

      //Log if the Leader Changes
      if (values.leaderId !== initialValues.leaderId) {
        try {
          await MakeGovernorshipLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              governorshipId: governorshipId,
            },
          })

          alertMsg('Leader Changed Successfully')
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

      setSubmitting(false)
      resetForm()
      router.push(`/governorship/displaydetails`)
    } catch (error: any) {
      throwToSentry('There was a problem updating this governorship', error)
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <GovernorshipForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        title={`Update Governorship Form`}
        newGovernorship={false}
      />
    </ApolloWrapper>
  )
}

export default UpdateGovernorship
