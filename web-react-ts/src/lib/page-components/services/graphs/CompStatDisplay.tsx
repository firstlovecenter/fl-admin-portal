import PlaceholderCustom from 'components/Placeholder'
import React from 'react'
import './Graphs.css'

const StatDisplay = ({
  title,
  statistic,
  loading,
}: {
  title: string
  statistic?: string | number
  loading?: boolean
}) => {
  let stat = parseInt(statistic?.toString() || '0')

  if (isNaN(stat)) {
    stat = 0
  }
  return (
    <>
      <p className="dashboard-title text-truncate">{title}</p>
      <PlaceholderCustom
        className="info-text"
        loading={loading}
        as="p"
        animation="wave"
      >
        <p className="info-text">{stat}</p>
      </PlaceholderCustom>
    </>
  )
}

export default StatDisplay
