import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import './ChurchButton.css'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { Button } from 'components/ui/button'

type ChurchButtonProps = {
  church: {
    id: string
    name: string
    __typename: string
  }
}

const ChurchButton = (props: ChurchButtonProps) => {
  const { church } = props
  const { clickCard } = useContext(ChurchContext)
  const { setUserFinancials } = useSetUserChurch()

  return (
    <PlaceholderCustom
      as="div"
      className="card-buttons py-2 px-3 text-center text-nowrap"
    >
      <Link to={`/${church.__typename.toLowerCase()}/displaydetails`}>
        <Button
          variant="secondary"
          className="card-buttons py-2 px-3 text-center text-nowrap"
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
    </PlaceholderCustom>
  )
}

export default ChurchButton
