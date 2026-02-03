import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'

const CurrencySpan = ({
  number,
  className,
  negative,
}: {
  number: number
  className?: string
  negative?: boolean
}) => {
  const { currentUser } = useContext(MemberContext)

  if (number !== null && number >= 0) {
    return (
      <span className={className}>
        <span>{number.toFixed(2)} </span>
        <span className="small">{currentUser.currency}</span>
      </span>
    )
  }
  if (negative) {
    return (
      <span className={className + ' red'}>
        <span>{number.toFixed(2)} </span>
        <span className="small">{currentUser.currency}</span>
      </span>
    )
  }
  return <span />
}

export default CurrencySpan
