import React, { useContext } from 'react'
import { MemberContext } from 'contexts/MemberContext'
import { Button } from 'react-bootstrap'
import './TrendsButton.css'

type Props = {
  name: string
  number: number
  color: string
  onClick?: () => void
}

const DefaultersMenuButton = (props: Props) => {
  const { theme } = useContext(MemberContext)

  return (
    <Button
      onClick={props.onClick}
      variant="secondary"
      className={`${theme}`}
      size="lg"
    >
      <div>
        <h6 className="text-secondary">{props.name}</h6>
        <h1 className={`defaulters-number ${props.color}`}>{props.number}</h1>
      </div>
    </Button>
  )
}

export default DefaultersMenuButton
