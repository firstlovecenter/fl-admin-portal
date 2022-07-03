import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { alertMsg, capitalise, throwErrorMsg } from '../../../global-utils'

import { GET_CONSTITUENCY_BACENTAS } from '../../../queries/ListQueries'
import {
  ADD_BACENTA_FELLOWSHIPS,
  REMOVE_BACENTA_CONSTITUENCY,
  UPDATE_BACENTA_MUTATION,
  REMOVE_FELLOWSHIP_BACENTA,
  ADD_BACENTA_CONSTITUENCY,
} from './UpdateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { DISPLAY_BACENTA } from '../display/ReadQueries'
import {
  CREATE_HISTORY_SUBSTRUCTURE,
  LOG_BACENTA_HISTORY,
  LOG_FELLOWSHIP_HISTORY,
} from './LogMutations'
import { MAKE_BACENTA_LEADER } from './ChangeLeaderMutations'
import BacentaForm from '../reusable-forms/BacentaForm'
import { MAKE_FELLOWSHIP_INACTIVE } from './CloseChurchMutations'
import {
  MAKE_BACENTA_GRADUATED,
  MAKE_BACENTA_IC,
  SET_ACTIVE_BACENTA,
  SET_VACATION_BACENTA,
} from './StatusChanges'
import { addNewChurches, removeOldChurches } from './directory-utils'

const UpdateBacenta = () => {
  const { church, bacentaId, clickCard } = useContext(ChurchContext)
  const { data: bacentaData, loading: bacentaLoading } = useQuery(
    DISPLAY_BACENTA,
    {
      variables: { id: bacentaId },
    }
  )
  const navigate = useNavigate()
  const bacenta = bacentaData?.bacentas[0]

  const initialValues = {
    name: bacenta?.name,
    leaderName: bacenta?.leader?.fullName ?? '',
    leaderId: bacenta?.leader?.id || '',
    constituency: bacenta?.constituency?.id,
    fellowships: bacenta?.fellowships.length ? bacenta?.fellowships : [''],
    vacationStatus: bacenta?.vacationStatus,
    graduationStatus: bacenta?.graduationStatus,
  }

  const [LogBacentaHistory] = useMutation(LOG_BACENTA_HISTORY)

  const [LogFellowshipHistory] = useMutation(LOG_FELLOWSHIP_HISTORY, {
    refetchQueries: [{ query: DISPLAY_BACENTA, variables: { id: bacentaId } }],
  })

  const [MakeBacentaLeader] = useMutation(MAKE_BACENTA_LEADER)
  const [MakeBacentaIC] = useMutation(MAKE_BACENTA_IC)
  const [MakeBacentaGraduated] = useMutation(MAKE_BACENTA_GRADUATED)
  const [SetBacentaOnVacation] = useMutation(SET_VACATION_BACENTA)
  const [SetBacentaActive] = useMutation(SET_ACTIVE_BACENTA)
  const [UpdateBacenta] = useMutation(UPDATE_BACENTA_MUTATION, {
    refetchQueries: [
      {
        query: GET_CONSTITUENCY_BACENTAS,
        variables: { id: initialValues.constituency },
      },
    ],
  })

  //Changes downwards.ie. Changes to the Fellowships underneath the Bacenta
  const [AddBacentaFellowships] = useMutation(ADD_BACENTA_FELLOWSHIPS)
  const [CloseDownFellowship] = useMutation(MAKE_FELLOWSHIP_INACTIVE)
  const [RemoveFellowshipFromBacenta] = useMutation(REMOVE_FELLOWSHIP_BACENTA, {
    onCompleted: (data) => {
      let prevBacenta = data.updateBacentas.bacentas[0]
      let fellowship = data.updateFellowships.fellowships[0]
      let newBacentaId = ''
      let oldBacentaId = ''
      let historyRecord

      if (prevBacenta.id === bacentaId) {
        //Fellowship has previous bacenta which is current bacenta and is going
        oldBacentaId = bacentaId
        newBacentaId = ''
        historyRecord = `${fellowship.name} Fellowship has been closed down under ${initialValues.name} Bacenta`
      } else if (prevBacenta.id !== bacentaId) {
        //Fellowship has previous bacenta which is not current bacenta and is joining
        oldBacentaId = prevBacenta.id
        newBacentaId = bacentaId
        historyRecord = `${fellowship.name} Fellowship has been moved to ${initialValues.name} Bacenta from ${prevBacenta.name} Bacenta`
      }

      //After removing the fellowship from a bacenta, then you log that change.
      LogFellowshipHistory({
        variables: {
          fellowshipId: fellowship.id,
          newLeaderId: '',
          oldLeaderId: '',
          newBacentaId: newBacentaId,
          oldBacentaId: oldBacentaId,
          historyRecord: historyRecord,
        },
      })
    },
  })

  //Changes upwards. ie. Changes to the Constituency the Bacenta is under
  const [CreateHistorySubstructure] = useMutation(CREATE_HISTORY_SUBSTRUCTURE)
  const [RemoveBacentaConstituency] = useMutation(REMOVE_BACENTA_CONSTITUENCY)

  const [AddBacentaConstituency] = useMutation(ADD_BACENTA_CONSTITUENCY, {
    onCompleted: (data) => {
      const oldConstituency = data.updateConstituencies.constituencies[0]
      const newConstituency = data.updateBacentas.bacentas[0].constituency

      let recordIfoldConstituency = `${initialValues.name} Bacenta has been moved from ${oldConstituency.name} Constituency to ${newConstituency.name} Constituency`

      //After Adding the bacenta to a constituency, then you log that change.
      LogBacentaHistory({
        variables: {
          bacentaId: bacentaId,
          newLeaderId: '',
          oldLeaderId: '',
          newConstituencyId: newConstituency.id,
          oldConstituencyId: oldConstituency.id,
          historyRecord: recordIfoldConstituency,
        },
      }).then(() =>
        CreateHistorySubstructure({
          variables: {
            churchType: 'Bacenta',
            servantType: 'Leader',
            churchId: bacentaId,
          },
        })
      )
    },
  })

  //onSubmit receives the form state as argument
  const onSubmit = async (values, onSubmitProps) => {
    onSubmitProps.setSubmitting(true)
    clickCard({ id: values.constituency, __typename: 'Constituency' })
    try {
      await UpdateBacenta({
        variables: {
          bacentaId: bacentaId,
          name: values.name,
          leaderId: values.leaderId,
          constituencyId: values.constituency,
        },
      })
    } catch (error) {
      throwErrorMsg(error)
    }
    //Log if Bacenta Name Changes
    if (values.name !== initialValues.name) {
      await LogBacentaHistory({
        variables: {
          bacentaId: bacentaId,
          newLeaderId: '',
          oldLeaderId: '',
          oldConstituencyId: '',
          newConstituencyId: '',
          historyRecord: `Bacenta name has been changed from ${initialValues.name} to ${values.name}`,
        },
      })
    }

    //Change from IC to Graduated
    if (values.graduationStatus !== initialValues.graduationStatus) {
      if (values.graduationStatus === 'IC') {
        await MakeBacentaIC({
          variables: {
            bacentaId: bacentaId,
          },
        })
      }

      if (values.graduationStatus === 'Graduated') {
        await MakeBacentaGraduated({ variables: { bacentaId: bacentaId } })
      }
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
      } catch (error) {
        throwErrorMsg('There was an error changing the leader', error)
      }
    }

    //Log If The Constituency Changes
    if (values.constituency !== initialValues.constituency) {
      await RemoveBacentaConstituency({
        variables: {
          higherChurch: initialValues.constituency,
          lowerChurch: [bacentaId],
        },
      })
      await AddBacentaConstituency({
        variables: {
          constituencyId: values.constituency,
          oldConstituencyId: initialValues.constituency,
          bacentaId: bacentaId,
        },
      })
    }
    //For the adding and removing of fellowships
    const oldFellowships = initialValues.fellowships.map(
      (fellowship) => fellowship
    )

    const newFellowships = values.fellowships.map((fellowship) => fellowship)

    const lists = {
      oldChurches: oldFellowships,
      newChurches: newFellowships,
    }

    const mutations = {
      closeDownChurch: CloseDownFellowship,
      removeChurch: RemoveFellowshipFromBacenta,
      addChurch: AddBacentaFellowships,
      logChurchHistory: LogFellowshipHistory,
      CreateHistorySubstructure: CreateHistorySubstructure,
    }

    const args = {
      initialValues,
      bacentaId,
    }
    Promise.all([
      await removeOldChurches(lists, mutations),
      await addNewChurches(lists, mutations, args),
    ])

    onSubmitProps.setSubmitting(false)
    onSubmitProps.resetForm()

    navigate(`/bacenta/displaydetails`)
  }

  return (
    <BacentaForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title={`${capitalise(church.subChurch)} Update Form`}
      loading={bacentaLoading}
    />
  )
}

export default UpdateBacenta
