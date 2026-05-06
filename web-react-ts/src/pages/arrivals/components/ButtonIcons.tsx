import BusIcon from 'assets/icons/BusIcon'
import CarFrontFill from 'assets/icons/Car'
import UrvanFront from 'assets/icons/Urvan'
import { CircleStop } from 'lucide-react'

const ButtonIcons = ({ type }: { type?: 'Sprinter' | 'Urvan' | 'Car' }) => {
  if (type === 'Sprinter') {
    return <BusIcon width={20} />
  }
  if (type === 'Urvan') {
    return <UrvanFront width={20} height={20} />
  }
  if (type === 'Car') {
    return <CarFrontFill width={20} height={20} />
  }

  return <CircleStop className="size-5" />
}

export default ButtonIcons
