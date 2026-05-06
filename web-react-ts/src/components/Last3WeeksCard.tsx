import { getWeekNumber } from 'global-utils'
import { cn } from 'components/lib/utils'
import { VacationStatusOptions } from 'global-types'

export type Last3WeeksCardProps = {
  last3Weeks: {
    number: number
    filled: boolean
    banked: boolean | 'No Service'
  }[]
}

export const shouldFill = ({
  last3Weeks,
  vacation,
}: {
  last3Weeks: Last3WeeksCardProps['last3Weeks']
  vacation: VacationStatusOptions
}) => {
  let result = true

  const filledThisWeek = last3Weeks?.filter(
    (week) => week.number === getWeekNumber()
  )
  if (filledThisWeek?.length && filledThisWeek[0].filled === true) {
    result = false
  }

  if (vacation === 'Vacation') {
    result = false
  }

  return result
}

const Last3WeeksCard = ({ last3Weeks }: Last3WeeksCardProps) => {
  if (last3Weeks.every((week) => week.banked === 'No Service')) return <></>

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Forms
      </h3>
      <div className="space-y-3">
        {last3Weeks.map((week, i) => {
          if (week.banked === 'No Service') {
            return (
              <div key={i} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Week {week.number}
                </p>
                <p className="text-sm font-medium text-foreground">No Service</p>
              </div>
            )
          }

          return (
            <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground">Week {week.number}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Income Form</span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    week.filled
                      ? 'text-[hsl(var(--banking))]'
                      : 'text-destructive'
                  )}
                >
                  {week.filled ? 'Filled' : 'Not Filled'}
                </span>
              </div>
              {week.filled &&
                (typeof week.banked === 'boolean' ||
                  week.banked === 'No Service') && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Banking Slip</span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        week.banked
                          ? 'text-[hsl(var(--banking))]'
                          : 'text-destructive'
                      )}
                    >
                      {week.banked ? 'Submitted' : 'Not Submitted'}
                    </span>
                  </div>
                )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Last3WeeksCard
