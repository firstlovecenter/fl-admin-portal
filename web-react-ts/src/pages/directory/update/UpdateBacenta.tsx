import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, repackDecimals, throwToSentry } from '../../../global-utils'
import { GET_GOVERNORSHIP_BACENTAS } from '../../../queries/ListQueries'
import { UPDATE_BACENTA_MUTATION } from './UpdateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { DISPLAY_BACENTA } from '../display/ReadQueries'
import { LOG_BACENTA_HISTORY } from './LogMutations'
import {
  MAKE_BACENTA_LEADER,
  SET_BACENTA_ADMIN,
  SET_BACENTA_DEPUTY,
} from './ChangeLeaderMutations'
import BacentaForm, { BacentaFormValues } from '../reusable-forms/BacentaForm'
import { SET_ACTIVE_BACENTA, SET_VACATION_BACENTA } from './StatusChanges'
import { FormikHelpers } from 'formik'
import ApolloWrapper from 'components/base-component/ApolloWrapper'

const UpdateBacenta = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_BACENTA, {
    variables: { id: bacentaId },
  })
  const navigate = useNavigate()
  const bacenta = data?.bacentas[0]

  const initialValues: BacentaFormValues = {
    name: bacenta?.name,
    leaderName: bacenta?.leader?.firstName + ' ' + bacenta?.leader?.lastName,
    leaderId: bacenta?.leader?.id || '',
    leaderEmail: bacenta?.leader?.email ?? '',
    governorship: bacenta?.governorship,
    vacationStatus: bacenta?.vacationStatus,
    meetingDay: bacenta.meetingDay.day,
    venueLatitude: repackDecimals(bacenta?.location?.latitude) ?? '',
    venueLongitude: repackDecimals(bacenta?.location?.longitude) ?? '',
    adminId: bacenta?.admin?.id || '',
    adminName:
      bacenta?.admin?.firstName && bacenta?.admin?.lastName
        ? bacenta?.admin?.firstName + ' ' + bacenta?.admin?.lastName
        : '',
    deputyLeaderId: bacenta?.deputyLeader?.id || '',
    deputyLeaderName:
      bacenta?.deputyLeader?.firstName && bacenta?.deputyLeader?.lastName
        ? bacenta?.deputyLeader?.firstName +
          ' ' +
          bacenta?.deputyLeader?.lastName
        : '',
  }

  const [LogBacentaHistory] = useMutation(LOG_BACENTA_HISTORY, {
    refetchQueries: [{ query: DISPLAY_BACENTA, variables: { id: bacentaId } }],
  })

  const [MakeBacentaLeader] = useMutation(MAKE_BACENTA_LEADER)
  const [SetBacentaOnVacation] = useMutation(SET_VACATION_BACENTA)
  const [SetBacentaActive] = useMutation(SET_ACTIVE_BACENTA)
  const [UpdateBacenta] = useMutation(UPDATE_BACENTA_MUTATION, {
    refetchQueries: [
      {
        query: GET_GOVERNORSHIP_BACENTAS,
        variables: { id: initialValues?.governorship?.id },
      },
    ],
  })
  const [SetBacentaAdmin] = useMutation(SET_BACENTA_ADMIN)
  const [SetBacentaDeputy] = useMutation(SET_BACENTA_DEPUTY)

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: BacentaFormValues,
    onSubmitProps: FormikHelpers<BacentaFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    setSubmitting(true)

    values.venueLongitude = parseFloat(values.venueLongitude.toString())
    values.venueLatitude = parseFloat(values.venueLatitude.toString())
    try {
      await UpdateBacenta({
        variables: {
          id: bacentaId,
          name: values.name,
          leaderId: values.leaderId,
          meetingDay: values.meetingDay,
          governorshipId: values.governorship,
          venueLongitude: values.venueLongitude,
          venueLatitude: values.venueLatitude,
        },
      })

      //Log if Bacenta Name Changes
      if (values.name !== initialValues.name) {
        await LogBacentaHistory({
          variables: {
            bacentaId: bacentaId,
            newLeaderId: '',
            oldLeaderId: '',
            oldGovernorshipId: '',
            newGovernorshipId: '',
            historyRecord: `Bacenta name has been changed from ${initialValues.name} to ${values.name}`,
          },
        })
      }

      // Log if the Meeting Day Changes
      if (values.meetingDay !== initialValues.meetingDay) {
        await LogBacentaHistory({
          variables: {
            bacentaId: bacentaId,
            newLeaderId: '',
            oldLeaderId: '',
            oldBacentaId: '',
            newBacentaId: '',

            historyRecord: `${values.name} Bacenta has changed their meeting day from ${initialValues.meetingDay} to ${values.meetingDay}`,
          },
        })
      }

      //Change if the vacation status changes
      if (values.vacationStatus !== initialValues.vacationStatus) {
        if (values.vacationStatus === 'Vacation') {
          await SetBacentaOnVacation({
            variables: {
              bacentaId: bacentaId,
            },
          })
        }
        if (values.vacationStatus === 'Active') {
          await SetBacentaActive({
            variables: {
              bacentaId: bacentaId,
            },
          })
        }
      }

      //Log if the Venue Changes
      if (
        repackDecimals(values.venueLongitude) !==
          repackDecimals(initialValues.venueLongitude) ||
        repackDecimals(values.venueLatitude) !==
          repackDecimals(initialValues.venueLatitude)
      ) {
        await LogBacentaHistory({
          variables: {
            bacentaId: bacentaId,
            newLeaderId: '',
            oldLeaderId: '',
            oldBacentaId: '',
            newBacentaId: '',

            historyRecord: `${values.name} Bacenta has changed their venue`,
          },
        })
      }

      //Log if the Leader Changes
      if (values.leaderId !== initialValues.leaderId) {
        try {
          await MakeBacentaLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              bacentaId: bacentaId,
            },
          })
          alertMsg('Leader Changed Successfully')
          navigate(`/bacenta/displaydetails`)
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

      // Log if Bacenta Admin changes
      if (values.adminId !== initialValues.adminId && values.adminId) {
        await SetBacentaAdmin({
          variables: {
            bacentaId,
            adminId: values.adminId,
          },
        })
        await LogBacentaHistory({
          variables: {
            bacentaId: bacentaId,
            newLeaderId: values.adminId,
            oldLeaderId: initialValues.adminId || '',
            oldBacentaId: '',
            newBacentaId: '',
            historyRecord: `${values.name} Bacenta Admin changed from ${initialValues.adminName} to ${values.adminName}`,
          },
        })
      }

      // Log if Deputy Leader changes
      if (
        values.deputyLeaderId !== initialValues.deputyLeaderId &&
        values.deputyLeaderId
      ) {
        await SetBacentaDeputy({
          variables: {
            bacentaId,
            deputyLeaderId: values.deputyLeaderId,
          },
        })
        await LogBacentaHistory({
          variables: {
            bacentaId: bacentaId,
            newLeaderId: values.deputyLeaderId,
            oldLeaderId: initialValues.deputyLeaderId || '',
            oldBacentaId: '',
            newBacentaId: '',
            historyRecord: `${values.name} Deputy Bacenta Leader changed from ${initialValues.deputyLeaderName} to ${values.deputyLeaderName}`,
          },
        })
      }

      resetForm()
      navigate(`/bacenta/displaydetails`)
    } catch (error: any) {
      throwToSentry(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <BacentaForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        title="Update Bacenta Form"
        newBacenta={false}
      />
    </ApolloWrapper>
  )
}

export default UpdateBacenta
