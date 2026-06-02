import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChurchContext } from 'contexts/ChurchContext'
import CloudinaryImage from 'components/CloudinaryImage'
import { Button } from 'components/ui/button'
import { Phone, MessageCircle, Navigation, User } from 'lucide-react'
import type { ChurchIdAndName } from 'global-types'
import type { PlaceType } from '../types'
import type { MemberMapData, Neo4jLocation } from './map-utils'
import { TYPENAME_LABEL } from '../maps-constants'

type MemberDescription = {
  member: MemberMapData & { location: Neo4jLocation }
  council: ChurchIdAndName
  pastor: MemberMapData
  phoneNumber: string
  whatsappNumber: string
}

type VenueDescription = {
  venue: {
    id: string
    name: string
    capacity: { low: number } | number
    school?: string
    university?: string
  }
  category: 'Outdoor' | 'Indoor' | 'Hostel' | 'High School'
}

const safeParse = <T,>(raw: string | undefined): T | null => {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

type InfoWindowCardProps = {
  place: PlaceType
}

const TYPENAME_TO_CATEGORY: Partial<
  Record<PlaceType['typename'], VenueDescription['category']>
> = {
  IndoorVenue: 'Indoor',
  OutdoorVenue: 'Outdoor',
  Hostel: 'Hostel',
  HighSchool: 'High School',
}

const MemberInfo = ({ place }: { place: PlaceType }) => {
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const parsed = safeParse<MemberDescription>(place.description)

  if (!parsed) return null
  const { member, council, pastor, phoneNumber, whatsappNumber } = parsed

  return (
    <div className="space-y-3">
      <dl className="space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="font-medium text-foreground">Council:</dt>
          <dd className="text-muted-foreground">{council.name}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-foreground">Pastor:</dt>
          <dd className="text-muted-foreground">
            {pastor.firstName} {pastor.lastName}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {phoneNumber ? (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="gap-1.5 min-h-9"
          >
            <a href={`tel:${phoneNumber}`}>
              <Phone className="size-4" />
              Call
            </a>
          </Button>
        ) : null}
        {whatsappNumber ? (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="gap-1.5 min-h-9 border-success/30 text-success hover:bg-success/10 hover:text-success"
          >
            <a
              href={`https://wa.me/${whatsappNumber}`}
              rel="noreferrer"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => {
            clickCard({ id: member.id, __typename: 'Member' })
            navigate('/member/displaydetails')
          }}
        >
          <User className="size-4" />
          View Member Profile
        </Button>
        {member.location ? (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="gap-1.5"
          >
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${member.location.y}%2C${member.location.x}`}
              rel="noreferrer"
            >
              <Navigation className="size-4" />
              Get Directions
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

const VenueInfo = ({ place }: { place: PlaceType }) => {
  const parsed = safeParse<VenueDescription>(place.description)
  // Hostels and High Schools historically don't ship a JSON description,
  // so fall back to the typename → category map and show what we have.
  const fallbackCategory = TYPENAME_TO_CATEGORY[place.typename] ?? ''
  const venue = parsed?.venue
  const category = parsed?.category ?? fallbackCategory
  const capacity = venue
    ? typeof venue.capacity === 'object'
      ? venue.capacity.low
      : venue.capacity
    : null
  const school = venue?.school ?? venue?.university

  return (
    <dl className="space-y-1.5 text-sm">
      {capacity !== null ? (
        <div className="flex gap-2">
          <dt className="font-medium text-foreground">Capacity:</dt>
          <dd className="tabular-nums text-muted-foreground">{capacity}</dd>
        </div>
      ) : null}
      {category ? (
        <div className="flex gap-2">
          <dt className="font-medium text-foreground">Category:</dt>
          <dd className="text-muted-foreground">{category}</dd>
        </div>
      ) : null}
      {school ? (
        <div className="flex gap-2">
          <dt className="font-medium text-foreground">School:</dt>
          <dd className="text-muted-foreground">{school}</dd>
        </div>
      ) : null}
    </dl>
  )
}

const InfoWindowCard = ({ place }: InfoWindowCardProps) => {
  const label = TYPENAME_LABEL[place.typename]
  const heading = label ? `${label} ${place.name}` : place.name

  const isMember = place.typename === 'Member' || place.typename === 'Bacenta'
  const isVenue =
    place.typename === 'IndoorVenue' ||
    place.typename === 'OutdoorVenue' ||
    place.typename === 'Hostel' ||
    place.typename === 'HighSchool'

  return (
    <div className="flex gap-3 pr-6">
      {place.picture ? (
        <CloudinaryImage src={place.picture} className="h-16 w-16 rounded-lg" />
      ) : null}
      <div className="min-w-0 flex-1 space-y-3">
        <p className="truncate text-sm font-semibold text-foreground">
          {heading}
        </p>
        {isMember ? <MemberInfo place={place} /> : null}
        {isVenue ? <VenueInfo place={place} /> : null}
      </div>
    </div>
  )
}

export default InfoWindowCard
