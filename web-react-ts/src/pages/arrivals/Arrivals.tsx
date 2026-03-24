import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import ChurchList from 'pages/services/ChurchList'

const Arrivals = () => {
  return (
    <div>
      <HeadingPrimary>Arrivals</HeadingPrimary>
      <HeadingSecondary>Click on one of churches below</HeadingSecondary>

      <ChurchList color="arrivals" />
    </div>
  )
}

export default Arrivals
