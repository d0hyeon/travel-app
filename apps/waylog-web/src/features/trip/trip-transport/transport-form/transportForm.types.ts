import { TransportType } from '@waylog/domains/modules/transport'
import z from 'zod'

export const TRANSPORT_FORM_STEPS = ['type', 'detail', 'ticket'] as const
export type TransportFormStep = (typeof TRANSPORT_FORM_STEPS)[number]

// 항목 하나가 티켓 행 하나다. 이미지마다 소유자를 따로 고른다.
export interface TransportTicketDraft {
  file: File
  memberId?: string
}

const TicketDraftSchema: z.ZodType<TransportTicketDraft> = z.object({
  file: z.instanceof(File),
  memberId: z.string().optional(),
})

// 교통편 하나가 갖는 값을 평평하게 든다. 입력 중에 종류가 바뀔 수 있어,
// 판별 유니온으로 들면 종류를 바꿀 때마다 이미 적은 값이 통째로 날아간다.
// 종류별로 갈리는 제약은 전송 시점에 TripTransportCarrier 로 접으며 회복한다.
export const TransportFormSchema = z.object({
  type: z.enum([TransportType.항공, TransportType.기차, TransportType.버스]),
  departureName: z.string().min(1),
  arrivalName: z.string().min(1),
  /** 항공만 갖는다. 목록에서 고른 경우에만 채워진다. */
  departureAirportCode: z.string().optional(),
  arrivalAirportCode: z.string().optional(),
  departureAt: z.string().min(1),
  arrivalAt: z.string().optional(),
  departureTimezone: z.string().optional(),
  arrivalTimezone: z.string().optional(),
  airline: z.string().optional(),
  airlineCode: z.string().optional(),
  flightNumber: z.string().optional(),
  tickets: z.array(TicketDraftSchema).default([]),
})

export type TransportFormValues = z.infer<typeof TransportFormSchema>
