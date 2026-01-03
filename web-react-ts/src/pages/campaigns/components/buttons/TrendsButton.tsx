import React, { useContext } from 'react'
import { MemberContext } from 'contexts/MemberContext'
import { Button } from 'react-bootstrap'
import './TrendsButton.css'
import ProgressBar from '../progress-bar/ProgressBar'
import { EquipmentChurch } from 'global-types'

export interface TrendsButtonProps {
  church: EquipmentChurch
  onClick?: () => void
}

const TrendsButton = (props: TrendsButtonProps) => {
  const { theme } = useContext(MemberContext)

  const church = props.church
  const churchType = church?.__typename

  const offeringBags = church?.equipmentRecord?.offeringBags
  const bluetoothSpeakers = church?.equipmentRecord?.bluetoothSpeakers
  const pulpits = church?.equipmentRecord.pulpits
  const name = church?.name

  const governorshipTotal = () => {
    if (church?.equipmentRecord.pulpits === null) return 0
    else return 1
  }

  const governorshipCount =
    churchType === 'Governorship'
      ? governorshipTotal()
      : church?.governorshipEquipmentFilledCount
  const fellowshipCount = church?.fellowshipEquipmentFilledCount
  const offeringBagsPercentage = Math.round(
    (offeringBags / fellowshipCount) * 100
  )
  const pulpitsPercentage = Math.round((pulpits / governorshipCount) * 100)
  const bluetoothSpeakersPercentage = Math.round(
    (bluetoothSpeakers / fellowshipCount) * 100
  )

  return (
    <Button
      variant="secondary"
      className={`${theme} button`}
      onClick={props.onClick}
    >
      <div className="pb-3 pt-2">
        <div className="text">
          {name.toUpperCase()} {churchType.toUpperCase()}
        </div>
      </div>
      <div className="d-grid gap-1 pb-2">
        <div className="lowercase-text text-secondary">
          Offering Bags: {offeringBags} / {fellowshipCount}
        </div>
        <ProgressBar percentage={offeringBagsPercentage} />
        <div className="lowercase-text text-secondary">
          Pulpits: {pulpits ? pulpits : 0} / {governorshipCount}
        </div>
        <ProgressBar percentage={pulpitsPercentage} />
        <div className="lowercase-text text-secondary">
          Bluetooth Speakers: {bluetoothSpeakers} / {fellowshipCount}
        </div>
        <ProgressBar percentage={bluetoothSpeakersPercentage} />
      </div>
    </Button>
  )
}

export default TrendsButton
