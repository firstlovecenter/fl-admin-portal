import React from 'react'
import '../buttons/TrendsButton.css'

type Props = {
  percentage: number | typeof NaN
}

const ProgressBar = (props: Props) => {
  const percentage = props.percentage
  const getStyles = (num: number) => {
    if (num >= 0 && num <= 25) {
      return 'progress-bar-red'
    } else if (num > 25 && num <= 75) {
      return 'progress-bar-yellow'
    } else return 'progress-bar-green'
  }

  return (
    <div className="progress bg-secondary">
      <div
        className={getStyles(percentage)}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ width: `${percentage}%` }}
      >
        <div className="progress-bar-title">
          {isNaN(percentage) ? '0%' : `${percentage}%`}
        </div>
      </div>
    </div>
  )
}

export default ProgressBar
