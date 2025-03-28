import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, throwToSentry } from '../../../global-utils'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { DISPLAY_HUB } from '../display/ReadQueries'
import { LOG_HUB_HISTORY } from './LogMutations'
import { MAKE_HUB_LEADER } from './ChangeLeaderMutations'
import HubForm, { HubFormValues } from '../reusable-forms/HubForm'
import { SET_ACTIVE_HUB, SET_VACATION_HUB } from './StatusChanges'
import { FormikHelpers } from 'formik'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { GET_HUBCOUNCIL_HUBS } from 'queries/ListQueries'
import { UPDATE_HUB_MUTATION } from './UpdateSontaMutations'
import { repackDecimals } from '@jaedag/admin-portal-types'

const UpdateHub = () => {
  const { hubId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(DISPLAY_HUB, {
    variables: { id: hubId },
  })
  const navigate = useNavigate()
  const hub = data?.hubs[0]

  const initialValues: HubFormValues = {
    name: hub?.name,
    leaderName: hub?.leader?.firstName + ' ' + hub?.leader?.lastName ?? '',
    leaderId: hub?.leader?.id || '',
    leaderEmail: hub?.leader?.email ?? '',
    hubCouncil: hub?.hubCouncil?.id,
    governorship: hub?.governorship?.id ?? '',
    meetingDay: hub?.meetingDay?.day,
    vacationStatus: hub?.vacationStatus,
    venueLatitude: repackDecimals(hub?.location?.latitude) ?? '',
    venueLongitude: repackDecimals(hub?.location?.longitude) ?? '',
  }

  const [LogHubHistory] = useMutation(LOG_HUB_HISTORY, {
    refetchQueries: [{ query: DISPLAY_HUB, variables: { id: hubId } }],
  })

  const [MakeHubLeader] = useMutation(MAKE_HUB_LEADER)
  const [SetHubOnVacation] = useMutation(SET_VACATION_HUB)
  const [SetHubActive] = useMutation(SET_ACTIVE_HUB)
  const [UpdateHub] = useMutation(UPDATE_HUB_MUTATION, {
    refetchQueries: [
      {
        query: GET_HUBCOUNCIL_HUBS,
        variables: { id: initialValues.hubCouncil },
      },
    ],
  })

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: HubFormValues,
    onSubmitProps: FormikHelpers<HubFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    setSubmitting(true)

    values.venueLongitude = parseFloat(values.venueLongitude.toString())
    values.venueLatitude = parseFloat(values.venueLatitude.toString())

    try {
      await UpdateHub({
        variables: {
          hubId: hubId,
          name: values.name,
          leaderId: values.leaderId,
          meetingDay: values.meetingDay,
          venueLongitude: values.venueLongitude,
          venueLatitude: values.venueLatitude,
        },
      })

      //Log if Hub Name Changes
      if (values.name !== initialValues.name) {
        await LogHubHistory({
          variables: {
            hubId: hubId,
            newLeaderId: '',
            oldLeaderId: '',
            oldGovernorshipId: '',
            newGovernorshipId: '',
            historyRecord: `Hub name has been changed from ${initialValues.name} to ${values.name}`,
          },
        })
      }

      //Change if the vacation status changes
      if (values.vacationStatus !== initialValues.vacationStatus) {
        if (values.vacationStatus === 'Vacation') {
          await SetHubOnVacation({
            variables: {
              hubId: hubId,
            },
          })
        }
        if (values.vacationStatus === 'Active') {
          await SetHubActive({
            variables: {
              hubId: hubId,
            },
          })
        }
      }

      //Log if the Leader Changes
      if (values.leaderId !== initialValues.leaderId) {
        try {
          await MakeHubLeader({
            variables: {
              oldLeaderId: initialValues.leaderId || 'old-leader',
              newLeaderId: values.leaderId,
              hubId: hubId,
            },
          })
          alertMsg('Leader Changed Successfully')
          navigate(`/hub/displaydetails`)
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

      //Log if the Venue Changes
      if (
        repackDecimals(values.venueLongitude) !==
          repackDecimals(initialValues.venueLongitude) ||
        repackDecimals(values.venueLatitude) !==
          repackDecimals(initialValues.venueLatitude)
      ) {
        await LogHubHistory({
          variables: {
            hubId,
            newLeaderId: '',
            oldLeaderId: '',
            oldBacentaId: '',
            newBacentaId: '',

            historyRecord: `${values.name} Hub has changed their venue`,
          },
        })
      }

      resetForm()
      navigate(`/hub/displaydetails`)
    } catch (error: any) {
      throwToSentry(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <HubForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        title="Update Hub Form"
        newHub={false}
      />
    </ApolloWrapper>
  )
}

export default UpdateHub
