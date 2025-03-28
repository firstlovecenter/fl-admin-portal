import { ChurchLevel } from 'global-types'
import { BuildingsFill, MusicNoteBeamed } from 'react-bootstrap-icons'
import { BiBuildingHouse } from 'react-icons/bi'
import { BsBusFront, BsEyeFill } from 'react-icons/bs'
import { FaCogs, FaHubspot, FaTrophy } from 'react-icons/fa'
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
    return <FaTrophy />
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

  if (category === 'CreativeArts') {
    return <MusicNoteBeamed {...rest} />
  }

  if (category === 'Ministry') {
    return <BuildingsFill {...rest} />
  }
  if (category === 'HubCouncil') {
    return <FaCogs {...rest} />
  }

  if (category === 'Hub') {
    return <FaHubspot {...rest} />
  }

  return <div>SearchBadgeIcon</div>
}

export default SearchBadgeIcon
