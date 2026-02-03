import React from 'react'

type DateTimeDisplayProps = {
  value: number
  type: 'Days' | 'Hours' | 'Mins' | 'Seconds'
  isDanger: boolean
}

const DateTimeDisplay = ({ value, type, isDanger }: DateTimeDisplayProps) => {
  if (!value && !['Seconds', 'Mins'].includes(type)) return null
  return (
    <span>
      <span>{value.toString().padStart(2, '0')}</span>
      {type !== 'Seconds' && <span>:</span>}
    </span>
  )
}

export default DateTimeDisplay
