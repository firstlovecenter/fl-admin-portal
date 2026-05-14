import { Card, CardContent } from 'components/ui/card'
import { Bus, Wallet } from 'lucide-react'
import { formatCurrency } from '../accounts-utils'

type AccountBalanceCardProps = {
  church: {
    weekdayBalance?: number | null
    bussingSocietyBalance?: number | null
  }
  variant: 'current-balance' | 'bussing-society'
}

const AccountBalanceCard = ({ church, variant }: AccountBalanceCardProps) => {
  const isWeekday = variant === 'current-balance'

  const label = isWeekday ? 'Weekday Account Balance' : 'Bussing Society Balance'
  const hint = isWeekday
    ? 'Available for council expenses'
    : 'Reserved for Sunday bussing'
  const value = isWeekday ? church?.weekdayBalance : church?.bussingSocietyBalance
  const Icon = isWeekday ? Wallet : Bus
  const accentBg = isWeekday ? 'bg-banking/10' : 'bg-arrivals/10'
  const accentText = isWeekday ? 'text-banking' : 'text-arrivals'

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`flex size-10 items-center justify-center rounded-lg ${accentBg}`}
          >
            <Icon className={`size-5 ${accentText}`} />
          </span>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {formatCurrency(value)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default AccountBalanceCard
