import { Button } from 'react-bootstrap'
import { CheckCircleFill } from 'react-bootstrap-icons'
import { VehicleRecord } from '../arrivals-types'
import ButtonIcons from './ButtonIcons'
import CurrencySpan from 'components/CurrencySpan'

const VehicleButtonPayment = ({
  record,
  size,
  className,
  onClick,
}: {
  record: VehicleRecord
  size?: 'sm' | 'lg'
  className?: string
  onClick: () => void
}) => {
  return (
    <Button
      key={record.id}
      variant={record?.transactionStatus === 'success' ? 'success' : 'warning'}
      size={size || 'lg'}
      className={`text-start ${className}`}
      onClick={onClick}
    >
      <ButtonIcons type={record?.vehicle} />
      {record?.vehicle} (
      <CurrencySpan number={record?.vehicleTopUp} />)
      {record?.transactionStatus === 'success' ? (
        <CheckCircleFill className="ms-2" color="white" size={20} />
      ) : null}
    </Button>
  )
}

export default VehicleButtonPayment
