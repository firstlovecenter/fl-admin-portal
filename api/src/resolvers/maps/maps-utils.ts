import { Point } from 'neo4j-driver'
import { ChurchIdAndName } from '../utils/types'

export const createMemberDescription = ({
  member,
  bacenta,
  council,
  pastor,
  phone,
  WhatsApp,
}: {
  member: { firstName: string; lastName: string }
  bacenta: ChurchIdAndName
  council: ChurchIdAndName
  pastor: { firstName: string; lastName: string }
  phone: string
  WhatsApp: string
}) =>
  JSON.stringify({
    member,
    bacenta,
    council,
    pastor,
    phoneNumber: phone,
    whatsappNumber: WhatsApp,
  })

export const createBacentaDescription = ({
  bacentaLeader,
  bacenta,
  council,
  councilLeader,
}: {
  bacentaLeader: { firstName: string; lastName: string }
  bacenta: ChurchIdAndName
  council: ChurchIdAndName
  councilLeader: { firstName: string; lastName: string }
}) =>
  JSON.stringify({
    bacentaLeader,
    bacenta,
    council,
    councilLeader,
  })

export const createVenueDescription = ({
  venue,
  category,
}: {
  venue: {
    id: string
    name: string
    location: Point
    capacity: number
  }
  category: string
}) => {
  return JSON.stringify({
    venue,
    category,
  })
}
