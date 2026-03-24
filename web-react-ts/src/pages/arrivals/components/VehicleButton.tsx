import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { VehicleRecord } from '../arrivals-types'
import ButtonIcons from './ButtonIcons'
import { Button } from 'components/ui/button'

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
  const navigate = useNavigate()

  return (
    <Button
      key={record.id}
      variant={record?.arrivalTime ? 'success' : 'warning'}
      size={size || 'lg'}
      className={`text-start ${className}`}
      disabled={canFillOnTheWay === false}
      onClick={() => {
        clickCard(record)
        navigate('/bacenta/vehicle-details')
      }}
    >
      <ButtonIcons type={record?.vehicle} />
      {record?.vehicle} ({record?.attendance || '0'}){'  '}
      {record?.arrivalTime ? (
        <CheckCircle2 className="ms-3" color="white" size={20} />
      ) : null}
    </Button>
  )
}

export default VehicleButton
