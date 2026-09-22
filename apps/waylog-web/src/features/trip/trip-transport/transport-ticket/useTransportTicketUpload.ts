import { getTicketInfo, useTripTransport } from '@waylog/domains/modules/trip-transport'
import { uploadTransportTicketImage } from '~features/photo/photo.api'
import type { TransportTicketDraft } from '../transport-form/transportForm.types'

interface UploadParams {
  transportId: string
  tickets: TransportTicketDraft[]
}

// 생성 직후와 상세 화면 모두 "이미지 한 장 = 티켓 한 행" 규칙으로 저장한다.
export function useTransportTicketUpload(tripId: string) {
  const { addTicket, updateTicket } = useTripTransport(tripId)

  const upload = async ({ transportId, tickets }: UploadParams) => {
    await Promise.all(
      tickets.map(async ({ file, memberId }) => {
        const image = await uploadTransportTicketImage(transportId, file)
        const ticket = await addTicket({ transportId, memberId, image })
        const info = await getTicketInfo(image).catch(() => null)
        if (info != null) await updateTicket({ id: ticket.id, ...info })
      }),
    )
  }

  return { upload }
}
