import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import React from 'react'
import ChurchList from '../ChurchList'

const Defaulters = () => {
  return (
    <div>
      <HeadingPrimary>Defaulters</HeadingPrimary>
      <HeadingSecondary>Click on one of your churches below</HeadingSecondary>

      <ChurchList color="defaulters" link={'/services/defaulters/dashboard'} />
    </div>
  )
}

export default Defaulters
