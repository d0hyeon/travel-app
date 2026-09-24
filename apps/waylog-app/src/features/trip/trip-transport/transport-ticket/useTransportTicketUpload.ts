import { useQueryClient } from '@tanstack/react-query'
import { useAirportArrivalGuidance } from '@waylog/domains/modules/airport-arrival-guidance'
import { useFlightStatuses } from '@waylog/domains/modules/flight-status'
import {
  createTripTransportTicket,
  getTicketInfo,
  updateTripTransportTicket,
  useTripTransports,
} from '@waylog/domains/modules/trip-transport'
import { uploadTransportTicketImage } from '../../../photo/photo.api'
import type { TransportTicketDraft } from './transportTicket.types'

interface UploadParams {
  transportId: string
  tickets: TransportTicketDraft[]
}

// 생성 직후와 상세 화면 양쪽에서 같은 규칙으로 올린다.
// transportId 를 호출 인자로 받는 건 생성 맥락에서는 add() 가 반환한 뒤에야 알기 때문이다.
// 좌석·터미널이 실시간 정보·공항 도착 안내 계산에 쓰이므로, 저장 후 두
// 캐시를 함께 무효화한다 -- 항공편이 아니면 어차피 구독자가 없어 비용이 없다.
export function useTransportTicketUpload(tripId: string) {
  const queryClient = useQueryClient()
  const { refetch } = useTripTransports(tripId)

  const upload = async ({ transportId, tickets }: UploadParams) => {
    // 티켓 한 장이 행 하나다. 이미지마다 소유자가 다를 수 있다.
    await Promise.all(
      tickets.map(async ({ uri, memberId }) => {
        const url = await uploadTransportTicketImage(transportId, uri)
        const ticket = await createTripTransportTicket({ transportId, memberId, image: url })

        // 추출 실패가 업로드 성공을 무르지 않는다.
        const info = await getTicketInfo(url).catch(() => null)
        if (info != null) await updateTripTransportTicket({ id: ticket.id, ...info })
      }),
    )
    await refetch()
    await queryClient.invalidateQueries({ queryKey: useFlightStatuses.key() })
    await queryClient.invalidateQueries({ queryKey: useAirportArrivalGuidance.key({ tripId, transportId }) })
  }

  return { upload }
}
