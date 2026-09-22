import { TransportType } from "@waylog/domains/modules/transport";
import {
  useTripTransport,
  type TripTransportCarrier,
} from "@waylog/domains/modules/trip-transport";
import type { TransportFormValues } from "~features/transport/transport-form/transportForm.types";
import { useState } from "react";
import { useTransportTicketUpload } from "../transport-ticket/useTransportTicketUpload";
import {
  TransportFormSchema,
  type TransportSubmitValues,
} from "./transportForm.types";

interface TransportForm {
  form: Partial<TransportSubmitValues>;
  update: (value: Partial<TransportSubmitValues>) => void;
  /**
   * 마지막 입력은 setState 반영을 기다리지 않도록 함께 넘긴다.
   * 넘긴 값은 폼에도 반영되어, 전송이 실패해도 화면에 남는다.
   */
  create: (lastInput?: Partial<TransportSubmitValues>) => Promise<void>;
}

export function useTransportForm(tripId: string): TransportForm {
  const { add } = useTripTransport(tripId);
  const { upload } = useTransportTicketUpload(tripId);
  const [form, setForm] = useState<Partial<TransportSubmitValues>>({});

  const update = (value: Partial<TransportSubmitValues>) => {
    setForm((current) => ({ ...current, ...value }));
  };

  const create = async (lastInput: Partial<TransportSubmitValues> = {}) => {
    update(lastInput);

    const values = TransportFormSchema.parse({ ...form, ...lastInput });
    const { tickets, ...transport } = values;

    const created = await add({
      departureName: transport.departureName,
      arrivalName: transport.arrivalName,
      departureAirportCode: transport.departureAirportCode,
      arrivalAirportCode: transport.arrivalAirportCode,
      departureAt: transport.departureAt,
      arrivalAt: transport.arrivalAt,
      departureTimezone: transport.departureTimezone,
      arrivalTimezone: transport.arrivalTimezone,
      ...toCarrier(values),
    });

    await upload({ transportId: created.id, tickets });
  };

  return { form, update, create };
}

// 평평한 폼을 종류별 제약이 살아있는 도메인 유니온으로 접는다.
// 기차·버스로 바꾼 뒤에도 폼에는 이전 항공 값이 남아있을 수 있어, 종류에 맞는 것만 꺼낸다.
function toCarrier(values: TransportFormValues): TripTransportCarrier {
  if (values.type !== TransportType.항공) return { type: values.type };

  return {
    type: values.type,
    airline: values.airline,
    airlineCode: values.airlineCode,
    flightNumber: values.flightNumber,
  };
}
