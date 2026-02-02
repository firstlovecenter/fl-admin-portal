import { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, throwToSentry } from '../../../global-utils'
import { GET_CAMPUS_STREAMS } from '../../../queries/ListQueries'
import { UPDATE_STREAM_MUTATION } from './UpdateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { DISPLAY_STREAM } from '../display/ReadQueries'
import { LOG_STREAM_HISTORY } from './LogMutations'
import { MAKE_STREAM_LEADER } from './ChangeLeaderMutations'
import StreamForm, {
  StreamFormValues,
} from 'pages/directory/reusable-forms/StreamForm'
import { FormikHelpers } from 'formik'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { SET_ACTIVE_STREAM, SET_VACATION_STREAM } from './StatusChanges'

const UpdateStream = () => {
  const { streamId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_STREAM, {
    variables: { id: streamId },
  })

  const router = useRouter()
  const stream = data?.streams[0]

  const initialValues: StreamFormValues = {
    name: stream?.name,
    leaderName: stream?.leader?.firstName + ' ' + stream?.leader.lastName ?? '',
    adminId: stream?.admin?.id || '',
    leaderId: stream?.leader?.id || '',
    leaderEmail: stream?.leader?.email || '',
    bankAccount: stream?.bankAccount || '',
    meetingDay: stream?.meetingDay.day ?? '',
    vacationStatus: stream?.vacationStatus ?? '',
    campus: stream?.campus ?? '',
    councils: stream?.councils?.length ? stream.councils : [''],
    ministries: stream?.ministries?.length ? stream.ministries : [''],
  }

  const [LogStreamHistory] = useMutation(LOG_STREAM_HISTORY, {
    refetchQueries: [{ query: DISPLAY_STREAM, variables: { id: streamId } }],
  })
  const [MakeStreamLeader] = useMutation(MAKE_STREAM_LEADER)
  const [SetStreamActive] = useMutation(SET_ACTIVE_STREAM)
  const [SetStreamOnVacation] = useMutation(SET_VACATION_STREAM)

  const [UpdateStream] = useMutation(UPDATE_STREAM_MUTATION, {
    refetchQueries: [
      {
        query: GET_CAMPUS_STREAMS,
        variables: { id: initialValues.campus?.id },
      },
    ],
  })
  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: StreamFormValues,
    onSubmitProps: FormikHelpers<StreamFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    setSubmitting(true)

    try {
      await UpdateStream({
        variables: {
          streamId: streamId,
          name: values.name,
          bankAccount: values.bankAccount,
          campusId: values.campus,
          meetingDay: values.meetingDay,
        },
      })

      //Log if Stream Name Changes
      if (values.name !== initialValues.name) {
        await LogStreamHistory({
          variables: {
            streamId: streamId,
            newLeaderId: '',
            oldLeaderId: '',
            oldCampusId: '',
            newCampusId: '',
            historyRecord: `Stream name has been changed from ${initialValues.name} to ${values.name}`,
          },
        })
      }

      //Log if the Leader Changes
      if (values.leaderId !== initialValues.leaderId) {
        try {
          await MakeStreamLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              streamId: streamId,
            },
          })
          alertMsg('Leader Changed Successfully')
          router.push(`/stream/displaydetails`)
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

      if (values.vacationStatus !== initialValues.vacationStatus) {
        if (values.vacationStatus === 'Vacation') {
          await SetStreamOnVacation({
            variables: {
              streamId,
            },
          })
        }
        if (values.vacationStatus === 'Active') {
          await SetStreamActive({
            variables: {
              streamId,
            },
          })
        }
      }

      resetForm()
      router.push(`/stream/displaydetails`)
    } catch (err: any) {
      throwToSentry('There was a problem updating this stream', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <StreamForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        title={`Update Stream Form`}
        newStream={false}
      />
    </ApolloWrapper>
  )
}

export default UpdateStream
