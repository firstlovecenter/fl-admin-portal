import { ChurchLevel } from 'global-types'
import { BiBuildingHouse } from 'react-icons/bi'
import { BsBusFront, BsEyeFill } from 'react-icons/bs'
import { FaTrophy } from 'react-icons/fa'
import { GiCampingTent, GiTreeBranch, GiWaterfall } from 'react-icons/gi'

const SearchBadgeIcon = ({
  category,
  size,
  ...rest
}: {
  category: ChurchLevel
  size: number
}) => {
  if (category === 'Denomination') {
    return <FaTrophy {...rest} />
  }

  if (category === 'Oversight') {
    return <BsEyeFill {...rest} />
  }

  if (category === 'Campus') {
    return <GiTreeBranch {...rest} />
  }

  if (category === 'Stream') {
    return <GiWaterfall {...rest} />
  }

  if (category === 'Council') {
    return <BiBuildingHouse {...rest} />
  }

  if (category === 'Governorship') {
    return <GiCampingTent {...rest} />
  }

  if (category === 'Bacenta') {
    return <BsBusFront {...rest} />
  }

  return <div>SearchBadgeIcon</div>
}

export default SearchBadgeIcon
