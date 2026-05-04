import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Skeleton } from 'components/ui/skeleton'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberWithoutBioData } from 'global-types'
import { getFirstLetterInEveryWord } from 'global-utils'
import { useContext } from 'react'
import { useNavigate } from 'react-router'

const MemberAvatarWithName = ({
  member,
  loading,
  onClick,
}: {
  member: MemberWithoutBioData
  loading?: boolean
  onClick?: () => void
}) => {
  const isLoading = loading || !member
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const defaultNav = () => {
    clickCard(member)
    navigate('/member/displaydetails')
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
    )
  }

  const initials = `${member?.firstName?.[0] ?? ''}${member?.lastName?.[0] ?? ''}`
  const fullName = `${member?.firstName} ${getFirstLetterInEveryWord(member?.middleName)} ${member?.lastName}`

  return (
    <div
      className="flex items-center gap-2 cursor-pointer"
      onClick={onClick ?? defaultNav}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={member?.pictureUrl} alt={fullName} />
        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium text-foreground truncate">
        {fullName}
      </span>
    </div>
  )
}

export default MemberAvatarWithName
