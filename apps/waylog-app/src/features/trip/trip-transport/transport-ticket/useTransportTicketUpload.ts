import { getTicketInfo, useTripTransport } from '@waylog/domains/modules/trip-transport'
import { uploadTransportTicketImage } from '../../../photo/photo.api'
import type { TransportTicketDraft } from './transportTicket.types'

interface UploadParams {
  transportId: string
  tickets: TransportTicketDraft[]
}

// 생성 직후와 상세 화면 양쪽에서 같은 규칙으로 올린다.
// transportId 를 호출 인자로 받는 건 생성 맥락에서는 add() 가 반환한 뒤에야 알기 때문이다.
export function useTransportTicketUpload(tripId: string) {
  const { addTicket, updateTicket } = useTripTransport(tripId)

  const upload = async ({ transportId, tickets }: UploadParams) => {
    // 티켓 한 장이 행 하나다. 이미지마다 소유자가 다를 수 있다.
    await Promise.all(
      tickets.map(async ({ uri, memberId }) => {
        const url = await uploadTransportTicketImage(transportId, uri)
        const ticket = await addTicket({ transportId, memberId, image: url })

        // 추출 실패가 업로드 성공을 무르지 않는다.
        const info = await getTicketInfo(url).catch(() => null)
        if (info != null) await updateTicket({ id: ticket.id, ...info })
      }),
    )
  }

  return { upload }
}
