import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChurchContext } from 'contexts/ChurchContext'
import BusIcon from 'assets/icons/BusIcon'
import BacentaIcon from 'assets/icons/BacentaIcon'
import GovernorshipIcon from 'assets/icons/GovernorshipIcon'
import CouncilIcon from 'assets/icons/CouncilIcon'
import StreamIcon from 'assets/icons/StreamIcon'
import { Phone } from 'lucide-react'
import { USER_PLACEHOLDER } from 'global-utils'
import { ChurchLevel, Member, MemberWithoutBioData } from 'global-types'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { BsEyeFill, BsMusicNote } from 'react-icons/bs'
import SearchBadgeIcon from './SearchBadgeIcon'
import { BacentaWithArrivals } from 'pages/arrivals/arrivals-types'
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar'
import { Badge } from 'components/ui/badge'
import { Button } from 'components/ui/button'
import { cn } from 'components/lib/utils'

type CardMember = {
  __typename: string | ChurchLevel
  id: string
  name?: string
  firstName?: string
  lastName?: string
  nameWithTitle?: string
  pictureUrl?: string
  bacenta?: {
    id: string
    name: string
  }
  basonta?: {
    id: string
    name: string
  }
  leader?: Member
}

type MemberDisplayCardProps = {
  member: CardMember | BacentaWithArrivals
  leader?: MemberWithoutBioData
  attendance?: number
  onClick?: () => void
  contact?: boolean
  children?: React.ReactNode
}

const ChurchTypeIcon = ({ typename }: { typename: string }) => {
  switch (typename) {
    case 'Bacenta':
      return <BacentaIcon />
    case 'Governorship':
      return <GovernorshipIcon />
    case 'Council':
      return <CouncilIcon />
    case 'Stream':
      return <StreamIcon />
    case 'Oversight':
      return <BsEyeFill size={20} />
    case 'Bus':
      return <BusIcon />
    default:
      return null
  }
}

const MemberDisplayCard = (props: MemberDisplayCardProps) => {
  const { member, leader, children, contact, ...rest } = props
  const { clickCard } = useContext(ChurchContext)
  const { setUserFinancials } = useSetUserChurch()
  const navigate = useNavigate()

  let name: string = (member.name ?? '') + ' ' + member.__typename
  let details: string[] = [(member as CardMember)?.leader?.nameWithTitle || '']

  const hasPicture =
    !!(member as CardMember)?.pictureUrl || !!leader?.pictureUrl
  const hasLeaderPicture = !!(member as CardMember)?.leader?.pictureUrl

  const picture: string =
    (member as CardMember)?.pictureUrl ??
    leader?.pictureUrl ??
    (member as CardMember)?.leader?.pictureUrl ??
    USER_PLACEHOLDER

  switch (member.__typename) {
    case 'Member':
      name = (member as CardMember)?.nameWithTitle || ((member as CardMember).firstName + ' ' + (member as CardMember).lastName)
      details = [
        (member as CardMember).bacenta ? (member as CardMember).bacenta!.name + ' Bacenta' : '',
        (member as CardMember).basonta ? (member as CardMember).basonta!.name : '',
      ]
      break
    default:
      break
  }

  const clickFunction = () => {
    clickCard(member)
    if (member.__typename === 'Campus') {
      setUserFinancials(member)
    }
    navigate(`/${member.__typename.toLowerCase()}/displaydetails`)
  }

  const initials =
    member.__typename === 'Member'
      ? `${(member as CardMember).firstName?.[0] ?? ''}${(member as CardMember).lastName?.[0] ?? ''}`
      : name.slice(0, 2).toUpperCase()

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer active:bg-muted transition-colors"
        onClick={props.onClick || clickFunction}
      >
        {/* Avatar / Icon */}
        <div className="relative shrink-0">
          {hasLeaderPicture ? (
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={picture} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <Badge
                className={cn(
                  'absolute -bottom-1 -right-1 text-[9px] px-1 py-0',
                  member.__typename.toLowerCase()
                )}
              >
                <SearchBadgeIcon
                  category={member.__typename as ChurchLevel}
                  size={10}
                />
              </Badge>
            </div>
          ) : hasPicture ? (
            <Avatar className="h-12 w-12">
              <AvatarImage src={picture} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ChurchTypeIcon typename={member.__typename as string} />
            </div>
          )}
        </div>

        {/* Name + details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          {details.filter(Boolean).map((detail, i) => (
            <p key={i} className="text-xs text-muted-foreground truncate">
              {detail}
            </p>
          ))}
          {children && <div className="mt-1">{children}</div>}
        </div>
      </div>

      {contact && (
        <div className="flex gap-2 px-3 pb-3 border-t border-border pt-2">
          <a href={`tel:${leader?.phoneNumber}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Call
            </Button>
          </a>
          <a
            href={`https://wa.me/${leader?.whatsappNumber}`}
            className="flex-1"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </Button>
          </a>
        </div>
      )}
    </div>
  )
}

export default MemberDisplayCard
