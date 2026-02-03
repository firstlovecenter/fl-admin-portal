import React from 'react'
import ExpiredNotice from './ExpiredNotice'
import ShowCounter from './ShowCounter'
import useCountdown from './useCountdown'

const CountdownTimer = ({ targetDate }: { targetDate: number }) => {
  const { days, hours, minutes, seconds } = useCountdown(targetDate)

  if (days + hours + minutes + seconds <= 0) {
    return <ExpiredNotice />
  }
  return (
    <ShowCounter
      days={days}
      hours={hours}
      minutes={minutes}
      seconds={seconds}
    />
  )
}

export default CountdownTimer
