import { cn } from 'components/lib/utils'

type ShowCounterProps = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const CounterUnit = ({
  value,
  label,
  isDanger,
}: {
  value: number
  label: string
  isDanger: boolean
}) => (
  <div className="flex flex-col items-center gap-1 py-4">
    <span
      className={cn(
        'font-mono text-5xl font-black tabular-nums leading-none lg:text-6xl',
        isDanger ? 'text-destructive' : 'text-success'
      )}
    >
      {value.toString().padStart(2, '0')}
    </span>
    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  </div>
)

const ShowCounter = ({ days, hours, minutes, seconds }: ShowCounterProps) => {
  const isDanger = days === 0 && hours === 0 && minutes < 30

  const showDays = days > 0
  const showHours = showDays || hours > 0

  return (
    <div
      className={cn(
        'grid w-full divide-x divide-border',
        showDays ? 'grid-cols-4' : showHours ? 'grid-cols-3' : 'grid-cols-2'
      )}
    >
      {showDays && (
        <CounterUnit value={days} label="Days" isDanger={isDanger} />
      )}
      {showHours && (
        <CounterUnit value={hours} label="Hours" isDanger={isDanger} />
      )}
      <CounterUnit value={minutes} label="Mins" isDanger={isDanger} />
      <CounterUnit value={seconds} label="Secs" isDanger={isDanger} />
    </div>
  )
}

export default ShowCounter
