import { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, throwToSentry } from '../../../global-utils'
import { GET_OVERSIGHT_CAMPUSES } from '../../../queries/ListQueries'
import { UPDATE_CAMPUS_MUTATION } from './UpdateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { DISPLAY_CAMPUS } from '../display/ReadQueries'
import { LOG_CAMPUS_HISTORY } from './LogMutations'
import { MAKE_CAMPUS_LEADER } from './ChangeLeaderMutations'
import CampusForm, {
  CampusFormValues,
} from 'pages/directory/reusable-forms/CampusForm'
import { FormikHelpers } from 'formik'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const UpdateCampus = () => {
  const { campusId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_CAMPUS, {
    variables: { id: campusId },
  })

  const router = useRouter()
  const campus = data?.campuses[0]
  const initialValues: CampusFormValues = {
    name: campus?.name,
    leaderName: campus?.leader?.fullName ?? '',
    adminId: campus?.admin?.id || '',
    leaderId: campus?.leader?.id || '',
    leaderEmail: campus?.leader?.email || '',
    oversight: campus?.oversight,
    incomeTracking: campus?.noIncomeTracking ? 'No' : 'Yes',
    currency: campus?.currency,
    conversionRateToDollar: campus?.conversionRateToDollar,
    streams: campus?.streams?.length ? campus.streams : [''],
    creativeArts: campus?.creativeArts?.length ? campus.creativeArts : [''],
  }
  const [LogCampusHistory] = useMutation(LOG_CAMPUS_HISTORY, {
    refetchQueries: [
      {
        query: DISPLAY_CAMPUS,
        variables: { id: campusId },
      },
    ],
  })
  const [MakeCampusLeader] = useMutation(MAKE_CAMPUS_LEADER)
  const [UpdateCampus] = useMutation(UPDATE_CAMPUS_MUTATION, {
    refetchQueries: [
      {
        query: GET_OVERSIGHT_CAMPUSES,
        variables: { id: campus?.oversight.id },
      },
    ],
  })

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: CampusFormValues,
    onSubmitProps: FormikHelpers<CampusFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    setSubmitting(true)

    try {
      await UpdateCampus({
        variables: {
          campusId: campusId,
          name: values.name,
          oversightId: values.oversight,
          noIncomeTracking: values.incomeTracking === 'No' ? true : false,
          currency: values.currency,
          conversionRateToDollar: parseFloat(
            values.conversionRateToDollar.toString()
          ),
        },
      })

      //Log if Campus Name Changes
      if (values.name !== initialValues.name) {
        await LogCampusHistory({
          variables: {
            campusId: campusId,
            newLeaderId: '',
            oldLeaderId: '',
            oldOversightId: '',
            newOversightId: '',
            historyRecord: `Campus name has been changed from ${initialValues.name} to ${values.name}`,
          },
        })
      }

      //Log if the Leader Changes
      if (values.leaderId !== initialValues.leaderId) {
        try {
          await MakeCampusLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              campusId: campusId,
            },
          })
          alertMsg('Leader Changed Successfully')
          router.push(`/campus/displaydetails`)
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
      router.push(`/campus/displaydetails`)
    } catch (err: any) {
      throwToSentry('There was a problem updating this campus', err)
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <CampusForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        title={`Update Campus Form`}
        newCampus={false}
      />
    </ApolloWrapper>
  )
}

export default UpdateCampus
