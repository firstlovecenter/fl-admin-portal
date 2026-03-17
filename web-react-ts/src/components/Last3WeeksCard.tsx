import { getWeekNumber } from '@jaedag/admin-portal-types'
import { VacationStatusOptions } from 'global-types'
import React from 'react'

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
  let shouldFill = true

  // If the have filled their form this week, they shouldn't fill again
  const filledThisWeek = last3Weeks?.filter(
    (week) => week.number === getWeekNumber()
  )
  if (filledThisWeek?.length && filledThisWeek[0].filled === true) {
    shouldFill = false
  }

  if (vacation === 'Vacation') {
    shouldFill = false
  }

  return shouldFill
}

const Last3WeeksCard = ({ last3Weeks }: Last3WeeksCardProps) => {
  if (last3Weeks.every((week) => week.banked === 'No Service')) return <></>

  return (
    <div>
      <>
        <h3 className="mt-4">FORMS</h3>
        {last3Weeks.map((week, i) => {
          if (week.banked === 'No Service')
            return (
              <div key={i} className="mt-4 px-4">
                <div className="text-muted-foreground">{`WEEK ${week.number}`}</div>
                <p className="font-bold">No Service</p>
              </div>
            )

          return (
            <div key={i} className="mt-4 px-4">
              <div className="text-muted-foreground">{`WEEK ${week.number}`}</div>
              <p className="mb-0">
                Income Form -{' '}
                <span
                  className={`${week.filled ? 'filled' : 'not-filled'}`}
                >{`${week.filled ? 'Filled' : 'Not Filled'}`}</span>
              </p>
              {week.filled &&
                (typeof week.banked === 'boolean' ||
                  week.banked === 'No Service') && (
                  <p>
                    Banking Slip -{' '}
                    <span
                      className={`${week.banked ? 'filled' : 'not-filled'}`}
                    >{`${week.banked ? 'Submitted' : 'Not Submitted'}`}</span>
                  </p>
                )}
            </div>
          )
        })}
      </>
    </div>
  )
}

export default Last3WeeksCard
