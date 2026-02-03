import React from 'react'
import DateTimeDisplay from './DateTimeDisplay'

type ShowCounterProps = {
  days: number
  hours: number
  minutes: number
  seconds: number
}
const ShowCounter = ({ days, hours, minutes, seconds }: ShowCounterProps) => {
  const isDanger = minutes < 30
  return (
    <div className={`display-1 ${isDanger ? 'countdown danger' : 'countdown'}`}>
      <DateTimeDisplay value={days} type="Days" isDanger={days <= 3} />
      <DateTimeDisplay value={hours} type="Hours" isDanger={false} />
      <DateTimeDisplay value={minutes} type="Mins" isDanger={false} />
      <DateTimeDisplay value={seconds} type="Seconds" isDanger={false} />
    </div>
  )
}

export default ShowCounter
