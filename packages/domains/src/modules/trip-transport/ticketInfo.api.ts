import { supabase } from '../../gateways/client'
import type { TicketInfo } from './ticketInfo.utils'

// 추출은 읽기다. 저장은 updateTripTransportTicket 이 맡는다.
// 티켓 행과 무관해야 폼 prefill 에서도 쓸 수 있다.
export async function getTicketInfo(image: string): Promise<TicketInfo> {
  const { data, error } = await supabase.functions.invoke<TicketInfo>(getTicketInfo.path, {
    body: { image },
  })

  if (error != null) throw error
  return data ?? {}
}

getTicketInfo.path = 'ticket-info'
