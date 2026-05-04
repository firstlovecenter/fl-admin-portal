import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Skeleton } from 'components/ui/skeleton'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberWithoutBioData } from 'global-types'
import { useContext } from 'react'
import { Link } from 'react-router-dom'

const LeaderAvatar = ({
  leader,
  loading,
  leaderTitle,
}: {
  leader: MemberWithoutBioData
  leaderTitle?: string
  loading?: boolean
}) => {
  const { clickCard } = useContext(ChurchContext)
  const isLoading = loading || !leader

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    )
  }

  const initials = `${leader?.firstName?.[0] ?? ''}${leader?.lastName?.[0] ?? ''}`

  return (
    <Link
      to="/member/displaydetails"
      onClick={() => clickCard(leader)}
      className="flex items-center gap-3 py-3 no-underline"
    >
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={leader?.pictureUrl} alt={leader?.nameWithTitle} />
        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{leaderTitle}</p>
        <p className="text-sm font-semibold text-foreground truncate">
          {leader?.nameWithTitle}
        </p>
      </div>
    </Link>
  )
}

export default LeaderAvatar
