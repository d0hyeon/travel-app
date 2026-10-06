import { useQueryClient } from '@tanstack/react-query'
import { useAirportArrivalGuidance } from '@waylog/domains/modules/airport-arrival-guidance'
import { useFlightStatuses } from '@waylog/domains/modules/flight-status'
import {
  createTripTransportTicket,
  getTicketInfo,
  updateTripTransportTicket,
  useTripTransports,
} from '@waylog/domains/modules/trip-transport'
import { uploadTransportTicketImage } from '~features/photo/photo.api'
import type { TransportTicketDraft } from '../transport-form-funnel/transportForm.types'

interface UploadParams {
  transportId: string
  tickets: TransportTicketDraft[]
}

// 생성 직후와 상세 화면 모두 "이미지 한 장 = 티켓 한 행" 규칙으로 저장한다.
// 좌석·터미널이 실시간 정보·공항 도착 안내 계산에 쓰이므로, 저장 후 두
// 캐시를 함께 무효화한다 -- 항공편이 아니면 어차피 구독자가 없어 비용이 없다.
export function useTransportTicketUpload(tripId: string) {
  const queryClient = useQueryClient()
  const { refetch } = useTripTransports(tripId)

  const upload = async ({ transportId, tickets }: UploadParams) => {
    await Promise.all(
      tickets.map(async ({ file, memberId }) => {
        const image = await uploadTransportTicketImage(transportId, file)
        const ticket = await createTripTransportTicket({ transportId, memberId, image })
        const info = await getTicketInfo(image).catch(() => null)
        if (info != null) await updateTripTransportTicket({ id: ticket.id, ...info })
      }),
    )
    await refetch()
    await queryClient.invalidateQueries({ queryKey: useFlightStatuses.key() })
    await queryClient.invalidateQueries({ queryKey: useAirportArrivalGuidance.key({ tripId, transportId }) })
  }

  return { upload }
}
