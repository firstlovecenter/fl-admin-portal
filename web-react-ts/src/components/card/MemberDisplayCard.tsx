'use client'

import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { ChurchContext } from 'contexts/ChurchContext'
import BusIcon from 'assets/icons/BusIcon'
import FellowshipIcon from 'assets/icons/FellowshipIcon'
import BacentaIcon from 'assets/icons/BacentaIcon'
import GovernorshipIcon from 'assets/icons/GovernorshipIcon'
import CouncilIcon from 'assets/icons/CouncilIcon'
import StreamIcon from 'assets/icons/StreamIcon'
import { Badge, Button, Card } from 'react-bootstrap'
import '../../components/members-grids/MemberTable.css'
import './MemberDisplayCard.css'
import { TelephoneFill, Whatsapp } from 'react-bootstrap-icons'
import CloudinaryImage from 'components/CloudinaryImage'
import { USER_PLACEHOLDER } from 'global-utils'
import { ChurchLevel, Member, MemberWithoutBioData } from 'global-types'
import useSetUserChurch from 'hooks/useSetUserChurch'
import { BsEyeFill, BsMusicNote } from 'react-icons/bs'
import SearchBadgeIcon from './SearchBadgeIcon'
import { BacentaWithArrivals } from 'pages/arrivals/arrivals-types'

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

export const Icons = ({
  member,
  picture,
  noPicture,
  contact,
}: {
  member: CardMember
  picture?: string
  noPicture: boolean
  contact?: boolean
}) => {
  if (member.leader?.pictureUrl) {
    return (
      <div>
        <CloudinaryImage
          src={picture ?? ''}
          alt={member.nameWithTitle}
          className={`img-search rounded`}
        />
        <Badge
          pill
          className={`position-absolute ${
            contact ? 'search-badge-top' : 'search-badge'
          } ${member.__typename.toLowerCase()}`}
        >
          <SearchBadgeIcon
            category={member.__typename as ChurchLevel}
            size={20}
          />{' '}
          {member.__typename}
        </Badge>
      </div>
    )
  }

  if (noPicture) {
    return (
      <div className={`${picture && 'rounded-circle'} img-search`}>
        {member.__typename === 'Fellowship' && <FellowshipIcon />}
        {member.__typename === 'Bacenta' && <BacentaIcon />}
        {member.__typename === 'Governorship' && <GovernorshipIcon />}
        {member.__typename === 'Council' && <CouncilIcon />}
        {member.__typename === 'Stream' && <StreamIcon />}
        {member.__typename === 'Oversight' && <BsEyeFill />}
        {member.__typename === 'HubFellowship' && <BsMusicNote />}
        {member.__typename === 'Bus' && <BusIcon />}
      </div>
    )
  }

  return (
    <CloudinaryImage
      src={picture ?? ''}
      alt={member.nameWithTitle}
      className={`${picture && 'rounded-circle'} img-search`}
    />
  )
}

const MemberDisplayCard = (props: MemberDisplayCardProps) => {
  const { member, leader, children, contact, ...rest } = props
  const { clickCard } = useContext(ChurchContext)
  const { setUserFinancials } = useSetUserChurch()
  const router = useRouter()
  let name: string = member.name + ' ' + member.__typename
  let details: string[] = [member?.leader?.nameWithTitle || '']

  const noPicture = !(member as CardMember)?.pictureUrl && !leader?.pictureUrl

  let picture: string =
    (member as CardMember)?.pictureUrl ??
    leader?.pictureUrl ??
    member?.leader?.pictureUrl ??
    USER_PLACEHOLDER

  switch (member.__typename) {
    case 'Member':
      name = member?.nameWithTitle || member.firstName + ' ' + member.lastName
      details = [
        member.bacenta ? member.bacenta.name + ' Bacenta' : '',
        member.basonta ? member.basonta.name : '',
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
    router.push(`/${member.__typename.toLowerCase()}/displaydetails`)
  }

  return (
    <Card className="mobile-search-card">
      <Card.Body {...rest} onClick={props.onClick || clickFunction}>
        <div className="d-flex align-items-center">
          <div className="flex-shrink-0">
            <Icons
              noPicture={noPicture}
              picture={picture}
              member={member as Member}
              contact={!!contact}
            />
          </div>
          <div className="flex-grow-1 ms-3">
            <Card.Title>{name}</Card.Title>
            <div className={`text-secondary mb-0 `}>
              {details?.length &&
                details.map((detail, i) => (
                  <div key={i}>
                    <span>{detail}</span>
                    <br />
                  </div>
                ))}
            </div>
            <div>{children}</div>
          </div>
        </div>
      </Card.Body>
      {props.contact && (
        <Card.Footer>
          <div className="d-flex align-items-center">
            <a href={`tel:${leader?.phoneNumber}`}>
              <Button variant="primary">
                <TelephoneFill /> Call
              </Button>
            </a>
            <a
              href={`https://wa.me/${leader?.whatsappNumber}`}
              className="ms-3"
            >
              <Button variant="success">
                <Whatsapp /> WhatsApp
              </Button>
            </a>
          </div>
        </Card.Footer>
      )}
    </Card>
  )
}

export default MemberDisplayCard
