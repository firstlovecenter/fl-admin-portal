import { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, throwToSentry } from '../../../global-utils'
import { UPDATE_COUNCIL_MUTATION } from './UpdateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { DISPLAY_COUNCIL } from '../display/ReadQueries'
import { LOG_COUNCIL_HISTORY } from './LogMutations'
import { MAKE_COUNCIL_LEADER } from './ChangeLeaderMutations'
import CouncilForm, {
  CouncilFormValues,
} from 'pages/directory/reusable-forms/CouncilForm'
import { FormikHelpers } from 'formik'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const UpdateCouncil = () => {
  const { councilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_COUNCIL, {
    variables: { id: councilId },
  })

  const router = useRouter()
  const council = data?.councils[0]

  const initialValues: CouncilFormValues = {
    name: council?.name,
    leaderName:
      council?.leader?.firstName + ' ' + council?.leader?.lastName ?? '',
    adminId: council?.admin?.id || '',
    leaderId: council?.leader?.id || '',
    leaderEmail: council?.leader?.email || '',
    stream: council?.stream,
    governorships: council?.governorships?.length
      ? council.governorships
      : [''],
    hubCouncils: council?.hubCouncils,
  }

  const [LogCouncilHistory] = useMutation(LOG_COUNCIL_HISTORY, {
    refetchQueries: [{ query: DISPLAY_COUNCIL, variables: { id: councilId } }],
  })

  const [MakeCouncilLeader] = useMutation(MAKE_COUNCIL_LEADER)
  const [UpdateCouncil] = useMutation(UPDATE_COUNCIL_MUTATION)

  const onSubmit = async (
    values: CouncilFormValues,
    onSubmitProps: FormikHelpers<CouncilFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    setSubmitting(true)

    try {
      await UpdateCouncil({
        variables: {
          councilId: councilId,
          name: values.name,
        },
      })

      //Log if Council Name Changes
      if (values.name !== initialValues.name) {
        await LogCouncilHistory({
          variables: {
            councilId: councilId,
            newLeaderId: '',
            oldLeaderId: '',
            oldStreamId: '',
            newStreamId: '',
            historyRecord: `Council name has been changed from ${initialValues.name} to ${values.name}`,
          },
        })
      }

      //Log if the Leader Changes
      if (values.leaderId !== initialValues.leaderId) {
        try {
          await MakeCouncilLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              councilId: councilId,
            },
          })
          alertMsg('Leader Changed Successfully')
          router.push(`/council/displaydetails`)
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
      router.push(`/council/displaydetails`)
    } catch (error: any) {
      throwToSentry('There was a problem updating this council', error)
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <CouncilForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        title="Update Council Form"
        newCouncil={false}
      />
    </ApolloWrapper>
  )
}

export default UpdateCouncil
