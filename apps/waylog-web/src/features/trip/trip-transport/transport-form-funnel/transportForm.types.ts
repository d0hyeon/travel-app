import { TransportType } from "@waylog/domains/modules/transport";
import type { TransportFormValues } from "~features/transport/transport-form/transportForm.types";
import z from "zod";

export const TRANSPORT_FORM_STEPS = ["type", "detail", "ticket"] as const;
export type TransportFormStep = (typeof TRANSPORT_FORM_STEPS)[number];

// 항목 하나가 티켓 행 하나다. 이미지마다 소유자를 따로 고른다.
export interface TransportTicketDraft {
  file: File;
  memberId?: string;
}

const TicketDraftSchema: z.ZodType<TransportTicketDraft> = z.object({
  file: z.instanceof(File),
  memberId: z.string().optional(),
});

// 제출 시점에만 필요한 검증이라 퍼널이 스키마를 소유한다.
// 값의 모양(TransportFormValues) 자체는 trip과 무관한 순수 도메인이 소유한다.
export const TransportFormSchema: z.ZodType<
  TransportFormValues & { tickets: TransportTicketDraft[] }
> = z.object({
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
});

export type TransportSubmitValues = TransportFormValues & {
  tickets: TransportTicketDraft[];
};
