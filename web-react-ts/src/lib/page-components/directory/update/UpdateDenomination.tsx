import { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, throwToSentry } from '@/global-utils'
import { GET_DENOMINATION_OVERSIGHTS } from '@/queries/ListQueries'
import { UPDATE_DENOMINATION_MUTATION } from './UpdateMutations'
import { DISPLAY_DENOMINATION } from '../display/ReadQueries'
import { LOG_DENOMINATION_HISTORY } from './LogMutations'
import { MAKE_DENOMINATION_LEADER } from './ChangeLeaderMutations'
import DenominationForm, {
  DenominationFormValues,
} from 'pages/directory/reusable-forms/DenominationForm'
import { FormikHelpers } from 'formik'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const UpdateDenomination = () => {
  const { denominationId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_DENOMINATION, {
    variables: { id: denominationId },
  })

  const router = useRouter()
  const denomination = data?.denominations[0]
  const initialValues: DenominationFormValues = {
    name: denomination?.name,
    leaderName: denomination?.leader?.fullName ?? '',
    adminId: denomination?.admin?.id || '',
    leaderId: denomination?.leader?.id || '',
    leaderEmail: denomination?.leader?.email || '',
    oversights: denomination?.oversights?.length
      ? denomination.oversights
      : [''],
  }
  const [LogDenominationHistory] = useMutation(LOG_DENOMINATION_HISTORY, {
    refetchQueries: [
      {
        query: DISPLAY_DENOMINATION,
        variables: { id: denominationId },
      },
    ],
  })

  const [MakeDenominationLeader] = useMutation(MAKE_DENOMINATION_LEADER)
  const [UpdateDenomination] = useMutation(UPDATE_DENOMINATION_MUTATION, {
    refetchQueries: [
      {
        query: GET_DENOMINATION_OVERSIGHTS,
        variables: { id: denomination?.id },
      },
    ],
  })

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: DenominationFormValues,
    onSubmitProps: FormikHelpers<DenominationFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    setSubmitting(true)

    try {
      await UpdateDenomination({
        variables: {
          denominationId,
          name: values.name,
        },
      })

      //Log if Denominations Name Changes
      if (values.name !== initialValues.name) {
        await LogDenominationHistory({
          variables: {
            denominationId,
            newLeaderId: '',
            oldLeaderId: '',
            oldDenominationId: '',
            newDenominationId: '',
            historyRecord: `Denomination name has been changed from ${initialValues.name} to ${values.name}`,
          },
        })
      }

      //Log if the Leader Changes
      if (values.leaderId !== initialValues.leaderId) {
        try {
          await MakeDenominationLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              denominationId,
            },
          })
          alertMsg('Leader Changed Successfully')
          router.push(`/denomination/displaydetails`)
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
      router.push(`/denomination/displaydetails`)
    } catch (err: any) {
      throwToSentry('There was a problem updating this denomination', err)
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <DenominationForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        title="Update Denomination Form"
        newDenomination={false}
      />
    </ApolloWrapper>
  )
}

export default UpdateDenomination
