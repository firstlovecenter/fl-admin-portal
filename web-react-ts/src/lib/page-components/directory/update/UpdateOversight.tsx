import { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, throwToSentry } from '@/global-utils'
import { GET_DENOMINATION_OVERSIGHTS } from '@/queries/ListQueries'
import { UPDATE_OVERSIGHT_MUTATION } from './UpdateMutations'
import { DISPLAY_OVERSIGHT } from '../display/ReadQueries'
import { LOG_OVERSIGHT_HISTORY } from './LogMutations'
import { MAKE_OVERSIGHT_LEADER } from './ChangeLeaderMutations'
import OversightForm, {
  OversightFormValues,
} from 'pages/directory/reusable-forms/OversightForm'
import { FormikHelpers } from 'formik'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const UpdateOversight = () => {
  const { oversightId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_OVERSIGHT, {
    variables: { id: oversightId },
  })

  const router = useRouter()
  const oversight = data?.oversights[0]
  const initialValues: OversightFormValues = {
    name: oversight?.name,
    leaderName: oversight?.leader?.fullName ?? '',
    adminId: oversight?.admin?.id || '',
    leaderId: oversight?.leader?.id || '',
    leaderEmail: oversight?.leader?.email || '',
    denomination: oversight?.denomination,
    campuses: oversight?.campuses?.length ? oversight.campuses : [''],
  }
  const [LogOversightHistory] = useMutation(LOG_OVERSIGHT_HISTORY, {
    refetchQueries: [
      {
        query: DISPLAY_OVERSIGHT,
        variables: { id: oversightId },
      },
    ],
  })

  const [MakeOversightLeader] = useMutation(MAKE_OVERSIGHT_LEADER)
  const [UpdateOversight] = useMutation(UPDATE_OVERSIGHT_MUTATION, {
    refetchQueries: [
      {
        query: GET_DENOMINATION_OVERSIGHTS,
        variables: { id: oversight?.denomination.id },
      },
    ],
  })

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: OversightFormValues,
    onSubmitProps: FormikHelpers<OversightFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    setSubmitting(true)

    try {
      await UpdateOversight({
        variables: {
          oversightId,
          name: values.name,
          denominationId: values.denomination,
        },
      })

      //Log if Oversights Name Changes
      if (values.name !== initialValues.name) {
        await LogOversightHistory({
          variables: {
            oversightId,
            newLeaderId: '',
            oldLeaderId: '',
            oldDenominationId: '',
            newDenominationId: '',
            historyRecord: `Oversight name has been changed from ${initialValues.name} to ${values.name}`,
          },
        })
      }

      //Log if the Leader Changes
      if (values.leaderId !== initialValues.leaderId) {
        try {
          await MakeOversightLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              oversightId,
            },
          })
          alertMsg('Leader Changed Successfully')
          router.push(`/oversight/displaydetails`)
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
      router.push(`/oversight/displaydetails`)
    } catch (err: any) {
      throwToSentry('There was a problem updating this oversight', err)
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <OversightForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        title="Update Oversight Form"
        newOversight={false}
      />
    </ApolloWrapper>
  )
}

export default UpdateOversight
