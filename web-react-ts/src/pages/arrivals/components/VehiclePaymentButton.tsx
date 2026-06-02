import { CheckCircle2 } from 'lucide-react'

import { cn } from 'components/lib/utils'
import CurrencySpan from 'components/CurrencySpan'

import { VehicleRecord } from '../arrivals-types'
import ButtonIcons from './ButtonIcons'

const VehicleButtonPayment = ({
  record,
  className,
  onClick,
}: {
  record: VehicleRecord
  className?: string
  onClick: () => void
}) => {
  const paid = record?.transactionStatus === 'success'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors min-h-14',
        paid
          ? 'border-success/30 bg-success/10 hover:bg-success/15 active:bg-success/20'
          : 'border-warning/40 bg-warning/10 hover:bg-warning/15 active:bg-warning/20',
        className
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          paid ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
        )}
      >
        <ButtonIcons type={record?.vehicle} />
      </span>
      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {record?.vehicle}{' '}
        <span className="text-muted-foreground">
          (<CurrencySpan number={record?.vehicleTopUp} />)
        </span>
      </span>
      {paid && <CheckCircle2 className="size-5 shrink-0 text-success" />}
    </button>
  )
}

export default VehicleButtonPayment
