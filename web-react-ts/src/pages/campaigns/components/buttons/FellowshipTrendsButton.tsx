import React, { useContext } from 'react'
import { MemberContext } from 'contexts/MemberContext'
import { Button } from 'react-bootstrap'
import './TrendsButton.css'
import ProgressBar from '../progress-bar/ProgressBar'
import { TrendsButtonProps } from './TrendsButton'

const FellowshipTrendsButton = (props: TrendsButtonProps) => {
  const { theme } = useContext(MemberContext)

  const church = props.church
  const name = church?.name
  const churchType = church?.__typename
  const offeringBags = church?.equipmentRecord?.offeringBags
  const bluetoothSpeakers = church?.equipmentRecord?.bluetoothSpeakers

  const fellowshipTotal = () => {
    if (church?.equipmentRecord === null) return 0
    else return 1
  }

  const total =
    churchType === 'Fellowship'
      ? fellowshipTotal()
      : church?.fellowshipEquipmentFilledCount

  const offeringBagsPercentage = Math.round((offeringBags / total) * 100)
  const bluetoothSpeakersPercentage = Math.round(
    (bluetoothSpeakers / total) * 100
  )

  return (
    <Button
      variant="secondary"
      className={`${theme} button`}
      onClick={props.onClick}
    >
      <div className="pb-3 pt-2">
        <div className="text">
          {name?.toUpperCase()} {churchType?.toUpperCase()}{' '}
        </div>
      </div>
      <div className="d-grid gap-1 pb-3">
        <div className="lowercase-text text-secondary">
          Offering Bags: {offeringBags ? offeringBags : 0} / {total}
        </div>
        <ProgressBar percentage={offeringBagsPercentage} />
        <div className="lowercase-text text-secondary">
          Bluetooth Speakers: {bluetoothSpeakers ? bluetoothSpeakers : 0} /{' '}
          {total}
        </div>
        <ProgressBar percentage={bluetoothSpeakersPercentage} />
      </div>
    </Button>
  )
}

export default FellowshipTrendsButton
