import { ChurchContext } from 'contexts/ChurchContext'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { Building2, ChevronRight } from 'lucide-react'
import { useContext } from 'react'
import { Link } from 'react-router-dom'

type ChurchRowProps = {
  church: {
    id: string
    name: string
    __typename: string
  }
}

const ChurchRow = ({ church }: ChurchRowProps) => {
  const { clickCard } = useContext(ChurchContext)
  const { setUserFinancials } = useSetUserChurch()

  return (
    <Link
      to={`/${church.__typename.toLowerCase()}/displaydetails`}
      className="flex items-center gap-3 p-4 hover:bg-muted/50 active:bg-muted transition-colors"
      onClick={() => {
        clickCard(church)
        if (church.__typename === 'Campus') {
          setUserFinancials(church)
        }
      }}
    >
      <div className="h-10 w-10 rounded-full bg-members/10 flex items-center justify-center shrink-0">
        <Building2 className="h-5 w-5 text-members" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-foreground truncate">
          {church.name}
        </p>
        <p className="text-xs text-muted-foreground">{church.__typename}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </Link>
  )
}

export default ChurchRow
