import { useState } from 'react'

const useClickCard = () => {
  const [church, setChurch] = useState(
    sessionStorage.getItem('church')
      ? JSON.parse(sessionStorage.getItem('church'))
      : { church: '', subChurch: '' }
  )

  const [denominationId, setDenominationId] = useState(
    sessionStorage.getItem('denominationId')
      ? sessionStorage.getItem('denominationId')
      : ''
  )

  const [oversightId, setOversightId] = useState(
    sessionStorage.getItem('oversightId')
      ? sessionStorage.getItem('oversightId')
      : ''
  )

  const [campusId, setCampusId] = useState(
    sessionStorage.getItem('campusId') ? sessionStorage.getItem('campusId') : ''
  )
  const [streamId, setStreamId] = useState(
    sessionStorage.getItem('streamId') ?? ''
  )

  const [councilId, setCouncilId] = useState(
    sessionStorage.getItem('councilId') ?? ''
  )

  const [governorshipId, setGovernorshipId] = useState(
    sessionStorage.getItem('governorshipId') ?? ''
  )
  const [bacentaId, setBacentaId] = useState(
    sessionStorage.getItem('bacentaId') ?? ''
  )
  const [fellowshipId, setFellowshipId] = useState(
    sessionStorage.getItem('fellowshipId') ?? ''
  )
  const [serviceRecordId, setServiceRecordId] = useState(
    sessionStorage.getItem('serviceRecordId') ?? ''
  )
  const [bussingRecordId, setBussingRecordId] = useState(
    sessionStorage.getItem('bussingRecordId') ?? ''
  )
  const [vehicleRecordId, setVehicleRecordId] = useState(
    sessionStorage.getItem('vehicleRecordId') ?? ''
  )
  const [multiplicationRecordId, setMultiplicationRecordId] = useState(
    sessionStorage.getItem('multiplicationRecordId') ?? ''
  )

  const [hubFellowshipId, setHubFellowshipId] = useState(
    sessionStorage.getItem('hubFellowshipId') ?? ''
  )
  const [hubId, setHubId] = useState(sessionStorage.getItem('hubId') ?? '')
  const [hubCouncilId, setHubCouncilId] = useState(
    sessionStorage.getItem('hubCouncilId') ?? ''
  )
  const [ministryId, setMinistryId] = useState(
    sessionStorage.getItem('ministryId') ?? ''
  )
  const [creativeArtsId, setCreativeArtsId] = useState(
    sessionStorage.getItem('creativeArtsId') ?? ''
  )

  const [arrivalDate, setArrivalDate] = useState(
    sessionStorage.getItem('arrivaldate') ??
      new Date().toISOString().slice(0, 10)
  )

  const [transactionId, setTransactionId] = useState(
    sessionStorage.getItem('transactionId') ?? ''
  )

  const [memberId, setMemberId] = useState(
    sessionStorage.getItem('memberId') ?? ''
  )
  const determineStream = (card) => {
    setChurch({ church: card?.stream_name, subChurch: 'bacenta' })
    sessionStorage.setItem(
      'church',
      JSON.stringify({
        church: card?.stream_name,
        subChurch: 'bacenta',
      })
    )

    //Setting the Bacenta for the different levels under Bacenta
    switch (card.__typename) {
      case 'Fellowship':
        if (card?.bacenta?.id) {
          setBacentaId(card?.bacenta?.id)
          sessionStorage.setItem('bacentaId', card?.bacenta?.id)
        }
        break
      case 'Bacenta':
        if (card.id) {
          setBacentaId(card?.id)
          sessionStorage.setItem('bacentaId', card?.id)
        }

        break
      default:
        break
    }

    //Setting the Governorship for the different levels under Governorship
    switch (card.__typename) {
      case 'Fellowship':
        if (card?.bacenta?.governorship?.id) {
          setGovernorshipId(card?.bacenta?.governorship?.id)
          sessionStorage.setItem(
            'governorshipId',
            card?.bacenta?.governorship?.id
          )
        }
        break
      case 'Bacenta':
        if (card?.governorship?.id) {
          setGovernorshipId(card?.governorship?.id)
          sessionStorage.setItem('governorshipId', card?.governorship?.id)
        }
        break
      case 'Governorship':
        if (card?.id) {
          setGovernorshipId(card?.id)
          sessionStorage.setItem('governorshipId', card?.id)
        }
        break
      default:
        break
    }

    //Setting the Council for the different levels under Council eg. Governorship, Bacenta...
    switch (card.__typename) {
      case 'Fellowship':
        if (card?.bacenta?.governorship?.council?.id) {
          setCouncilId(card?.bacenta?.governorship?.council?.id)
          sessionStorage.setItem(
            'councilId',
            card?.bacenta?.governorship?.council?.id
          )
        }
        break
      case 'Bacenta':
        if (card?.governorship?.council?.id) {
          setCouncilId(card?.governorship?.council?.id)
          sessionStorage.setItem('councilId', card?.governorship?.council?.id)
        }
        break
      case 'Governorship':
        if (card?.council?.id) {
          setCouncilId(card?.council?.id)
          sessionStorage.setItem('councilId', card?.council?.id)
        }
        break
      case 'Council':
        if (card.id) {
          setCouncilId(card.id)
          sessionStorage.setItem('councilId', card.id)
        }
        break
      case 'Ministry':
        if (card.id) {
          setMinistryId(card.id)
          sessionStorage.setItem('ministryId', card.id)
        }
        break
      default:
        break
    }

    //Setting the Stream for the different levels under Stream
    switch (card.__typename) {
      case 'Fellowship':
        if (card?.bacenta?.governorship?.council?.stream?.id) {
          setStreamId(card?.bacenta?.governorship?.council?.stream?.id)
          sessionStorage.setItem(
            'streamId',
            card?.bacenta?.governorship?.council?.stream?.id
          )
        }
        break
      case 'Bacenta':
        if (card?.governorship?.council?.stream?.id) {
          setStreamId(card?.governorship?.council?.stream?.id)
          sessionStorage.setItem(
            'streamId',
            card?.governorship?.council?.stream?.id
          )
        }
        break
      case 'Governorship':
        if (card?.council?.stream?.id) {
          setStreamId(card?.council?.stream?.id)
          sessionStorage.setItem('streamId', card?.council?.stream?.id)
        }
        break
      case 'Council':
        if (card?.stream?.id) {
          setStreamId(card?.stream?.id)
          sessionStorage.setItem('streamId', card?.stream?.id)
        }
        break
      case 'Stream':
        if (card.id) {
          setStreamId(card.id)
          sessionStorage.setItem('streamId', card.id)
        }
        break
      default:
        break
    }

    //Setting the Campus for the different levels under Campus
    switch (card.__typename) {
      case 'Fellowship':
        if (card?.bacenta?.governorship?.council?.stream?.campus?.id) {
          setCampusId(card?.bacenta?.governorship?.council?.stream?.campus?.id)
          sessionStorage.setItem(
            'campusId',
            card?.bacenta?.governorship?.council?.stream?.campus?.id
          )
        }
        break
      case 'Bacenta':
        if (card?.governorship?.council?.stream?.campus?.id) {
          setCampusId(card?.governorship?.council?.stream?.campus?.id)
          sessionStorage.setItem(
            'campusId',
            card?.governorship?.council?.stream?.campus?.id
          )
        }
        break
      case 'Governorship':
        if (card?.council?.stream?.campus?.id) {
          setCampusId(card?.council?.stream?.campus?.id)
          sessionStorage.setItem('campusId', card?.council?.stream?.campus?.id)
        }
        break
      case 'Council':
        if (card?.stream?.campus?.id) {
          setCampusId(card?.stream?.campus?.id)
          sessionStorage.setItem('campusId', card?.stream?.campus?.id)
        }
        break
      case 'Stream':
        if (card?.campus?.id) {
          setCampusId(card?.campus?.id)
          sessionStorage.setItem('campusId', card?.campus?.id)
        }
        break
      case 'Campus':
        if (card.id) {
          setCampusId(card?.id)
          sessionStorage.setItem('campusId', card?.id)
        }
        break
      default:
        break
    }

    //Setting the Oversight for the different levels under Oversight
    switch (card.__typename) {
      case 'Fellowship':
        if (
          card?.bacenta?.governorship?.council?.stream?.campus?.oversight?.id
        ) {
          setOversightId(
            card?.bacenta?.governorship?.council?.stream?.campus?.oversight?.id
          )
          sessionStorage.setItem(
            'oversightId',
            card?.bacenta?.governorship?.council?.stream?.campus?.oversight?.id
          )
        }
        break
      case 'Bacenta':
        if (card?.governorship?.council?.stream?.campus?.oversight?.id) {
          setOversightId(
            card?.governorship?.council?.stream?.campus?.oversight?.id
          )
          sessionStorage.setItem(
            'oversightId',
            card?.governorship?.council?.stream?.campus?.oversight?.id
          )
        }
        break
      case 'Governorship':
        if (card?.council?.stream?.campus?.oversight?.id) {
          setOversightId(card?.council?.stream?.campus?.oversight?.id)
          sessionStorage.setItem(
            'oversightId',
            card?.council?.stream?.campus?.oversight?.id
          )
        }
        break
      case 'Council':
        if (card?.stream?.campus?.oversight?.id) {
          setOversightId(card?.stream?.campus?.oversight?.id)
          sessionStorage.setItem(
            'oversightId',
            card?.stream?.campus?.oversight?.id
          )
        }
        break
      case 'Stream':
        if (card?.campus?.oversight?.id) {
          setOversightId(card?.campus?.oversight?.id)
          sessionStorage.setItem('oversightId', card?.campus?.oversight?.id)
        }
        break
      case 'Campus':
        if (card?.oversight?.id) {
          setOversightId(card?.oversight?.id)
          sessionStorage.setItem('oversightId', card?.oversight?.id)
        }
        break
      case 'Oversight':
        if (card.id) {
          setOversightId(card?.id)
          sessionStorage.setItem('oversightId', card?.id)
        }
        break
      default:
        break
    }

    return
  }

  const clickCard = (card) => {
    if (!card) {
      return null
    }
    determineStream(card)

    switch (card.__typename) {
      case 'AccountTransaction':
        setTransactionId(card.id)
        sessionStorage.setItem('transactionId', card.id)
        break

      case 'Member':
        setMemberId(card.id)
        sessionStorage.setItem('memberId', card.id)
        break

      case 'HubFellowship':
        setHubFellowshipId(card.id)
        sessionStorage.setItem('hubFellowshipId', card.id)
        break

      case 'Hub':
        setHubId(card.id)
        sessionStorage.setItem('hubId', card.id)
        break
      case 'HubCouncil':
        setHubCouncilId(card.id)
        sessionStorage.setItem('hubCouncilId', card.id)
        break
      case 'Ministry':
        setMinistryId(card.id)
        sessionStorage.setItem('ministryId', card.id)
        break

      case 'CreativeArts':
        setCreativeArtsId(card.id)
        sessionStorage.setItem('creativeArtsId', card.id)
        break
      case 'Fellowship':
        setFellowshipId(card.id)
        sessionStorage.setItem('fellowshipId', card.id)
        break
      case 'Bacenta':
        setBacentaId(card.id)
        sessionStorage.setItem('bacentaId', card.id)
        break
      case 'Governorship':
        setGovernorshipId(card.id)
        sessionStorage.setItem('governorshipId', card.id)
        break
      case 'Council':
        setCouncilId(card.id)
        sessionStorage.setItem('councilId', card.id)
        break
      case 'Stream':
        setStreamId(card.id)
        sessionStorage.setItem('streamId', card.id)
        break
      case 'Campus':
        setCampusId(card.id)
        sessionStorage.setItem('campusId', card.id)
        break
      case 'Oversight':
        setOversightId(card.id)
        sessionStorage.setItem('oversightId', card.id)
        break
      case 'Denomination':
        setDenominationId(card.id)
        sessionStorage.setItem('denominationId', card.id)
        break

      case 'ServiceRecord':
        setServiceRecordId(card.id)
        sessionStorage.setItem('serviceRecordId', card.id)
        break
      case 'NoService':
        setServiceRecordId(card.id)
        sessionStorage.setItem('serviceRecordId', card.id)
        break
      case 'RehearsalRecord':
        setServiceRecordId(card.id)
        sessionStorage.setItem('serviceRecordId', card.id)
        break
      case 'MinistryAttendanceRecord':
        setServiceRecordId(card.id)
        sessionStorage.setItem('serviceRecordId', card.id)
        break
      case 'StageAttendanceRecord':
        setServiceRecordId(card.id)
        sessionStorage.setItem('serviceRecordId', card.id)
        break
      case 'BussingRecord':
        setBussingRecordId(card.id)
        sessionStorage.setItem('bussingRecordId', card.id)
        break
      case 'VehicleRecord':
        setVehicleRecordId(card.id)
        sessionStorage.setItem('vehicleRecordId', card.id)
        break
      case 'MultiplicationRecord':
        setMultiplicationRecordId(card.id)
        sessionStorage.setItem('multiplicationRecordId', card.id)
        break
      default:
        break
    }

    if (card.link === '' || card.governorship === true) {
      card.link = `/${card.__typename.toLowerCase()}/displaydetails`
    }
  }
  return {
    clickCard,
    church,
    memberId,
    denominationId,
    oversightId,
    campusId,
    streamId,
    councilId,
    governorshipId,
    bacentaId,
    fellowshipId,
    hubFellowshipId,
    hubId,
    hubCouncilId,
    ministryId,
    creativeArtsId,
    bussingRecordId,
    vehicleRecordId,
    serviceRecordId,
    multiplicationRecordId,
    arrivalDate,
    transactionId,

    //Set State
    setDenominationId,
    setOversightId,
    setCampusId,
    setChurch,
    setStreamId,
    setCouncilId,
    setGovernorshipId,
    setHubFellowshipId,
    setHubId,
    setHubCouncilId,
    setMinistryId,
    setCreativeArtsId,
    setArrivalDate,
    setTransactionId,
  }
}

export default useClickCard
