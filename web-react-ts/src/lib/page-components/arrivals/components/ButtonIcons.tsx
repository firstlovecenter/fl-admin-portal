import BusIcon from 'assets/icons/BusIcon'
import CarFrontFill from 'assets/icons/Car'
import UrvanFront from 'assets/icons/Urvan'
import React from 'react'
import { StopCircle } from 'react-bootstrap-icons'

const ButtonIcons = ({ type }: { type?: 'Sprinter' | 'Urvan' | 'Car' }) => {
  if (type === 'Sprinter') {
    return (
      <span className="button-icons">
        <BusIcon width={20} />
      </span>
    )
  }
  if (type === 'Urvan') {
    return (
      <span className="button-icons">
        <UrvanFront width={20} height={20} />
      </span>
    )
  }
  if (type === 'Car') {
    return (
      <span className="button-icons">
        <CarFrontFill width={20} height={20} />
      </span>
    )
  }

  return <StopCircle />
}

export default ButtonIcons
