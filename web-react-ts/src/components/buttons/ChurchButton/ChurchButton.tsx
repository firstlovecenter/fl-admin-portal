import { Button } from 'components/ui/button'
import { ChurchContext } from 'contexts/ChurchContext'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { useContext } from 'react'
import { Link } from 'react-router-dom'

type ChurchButtonProps = {
  church: {
    id: string
    name: string
    __typename: string
  }
}

const ChurchButton = ({ church }: ChurchButtonProps) => {
  const { clickCard } = useContext(ChurchContext)
  const { setUserFinancials } = useSetUserChurch()

  return (
    <Link to={`/${church.__typename.toLowerCase()}/displaydetails`}>
      <Button
        variant="outline"
        size="sm"
        className="text-nowrap"
        onClick={() => {
          clickCard(church)
          if (church.__typename === 'Campus') {
            setUserFinancials(church)
          }
        }}
      >
        {church.name}
      </Button>
    </Link>
  )
}

export default ChurchButton
