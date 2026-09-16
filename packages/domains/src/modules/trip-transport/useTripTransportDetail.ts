import { useAuth } from '../../gateways/auth'
import { useTripMembers, type TripMember } from '../trip-member'
import { findMyTicket } from './tripTransport.utils'
import { useTripTransport } from './useTripTransport'
import type { TripTransport, TripTransportTicket } from './tripTransport.types'
import { assert } from '@waylog/utility'

export interface TripTransportDetailTicket {
  ticket: TripTransportTicket
  owner: TripMember
}

export interface TripTransportDetail {
  transport: TripTransport
  primaryTicket: TripTransportTicket | undefined
  companionTickets: TripTransportDetailTicket[]
}

interface Props {
  tripId: string
  transportId: string
}

export function useTripTransportDetail({ tripId, transportId }: Props): TripTransportDetail {
  const { data: transports } = useTripTransport(tripId)
  const transport = transports.find((item) => item.id === transportId)

  assert(transport != null, 'transport를 찾을 수 없습니다.')

  const { data: members } = useTripMembers(tripId)
  const { data: auth } = useAuth({ required: false })

  const currentMemberId = members.find((member) => member.userId === auth?.profile.id)?.id
  const primaryTicket = findMyTicket(transport.tickets, currentMemberId)
  const companionTickets = transport.tickets.flatMap((ticket) => {
    if (ticket.id === primaryTicket?.id || ticket.memberId == null) return []

    const owner = members.find((member) => member.id === ticket.memberId)
    return owner == null ? [] : [{ ticket, owner }]
  })

  return { transport, primaryTicket, companionTickets }
}
