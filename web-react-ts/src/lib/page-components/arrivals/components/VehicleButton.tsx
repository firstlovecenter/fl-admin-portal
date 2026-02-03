import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Button } from 'react-bootstrap'
import { CheckCircleFill } from 'react-bootstrap-icons'
import { useRouter } from 'next/navigation'
import { VehicleRecord } from '../arrivals-types'
import ButtonIcons from './ButtonIcons'

const VehicleButton = ({
  record,
  canFillOnTheWay,
  size,
  className,
}: {
  record: VehicleRecord
  canFillOnTheWay?: boolean | null
  size?: 'sm' | 'lg'
  className?: string
}) => {
  const { clickCard } = useContext(ChurchContext)
  const router = useRouter()

  return (
    <Button
      key={record.id}
      variant={record?.arrivalTime ? 'success' : 'warning'}
      size={size || 'lg'}
      className={`text-start ${className}`}
      disabled={canFillOnTheWay === false}
      onClick={() => {
        clickCard(record)
        router.push('/bacenta/vehicle-details')
      }}
    >
      <ButtonIcons type={record?.vehicle} />
      {record?.vehicle} ({record?.attendance || '0'}){'  '}
      {record?.arrivalTime ? (
        <CheckCircleFill className="ms-3" color="white" size={20} />
      ) : null}
    </Button>
  )
}

export default VehicleButton
