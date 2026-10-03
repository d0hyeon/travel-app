import { useMemo } from "react";
import { useFlightStatuses } from "../flight-status";
import { TransportType } from "../transport";
import { applyFlightStatus } from "./tripTransport.utils";
import type {
  ScheduledTripTransport,
  TripTransport,
} from "./tripTransport.types";
import { useTripTransports } from "./useTripTransports";

/**
 * 교통편에 운항 정보를 반영해 돌려준다.
 *
 * 인터페이스는 [useTripTransports] 와 같다 -- 데이터만 갈아끼우므로
 * 호출부는 훅 이름만 바꾸면 된다.
 *
 * 사용자가 적은 시각은 틀릴 수 있고, 지연되면 예정 시각도 밀린다.
 * 운항 정보가 답한 값이 있으면 그것이 사실이다. 도착 시각은 운항 정보가
 * 모르므로 지연된 만큼 늦춘 추정값이다([applyFlightStatus]).
 */
export function useTripScheduledFlights(tripId: string) {
  const { data: transports, ...rest } = useTripTransports(tripId);

  const results = useFlightStatuses(
    transports.map((transport: TripTransport) =>
      transport.type === TransportType.항공
        ? {
            transportId: transport.id,
            airlineCode: transport.airlineCode,
            flightNumber: transport.flightNumber,
            departureAirportCode: transport.departureAirportCode,
            departureAt: transport.departureAt,
          }
        : {},
    ),
  );

  const data = useMemo<ScheduledTripTransport[]>(
    () =>
      transports.map((transport: TripTransport, index: number) =>
        applyFlightStatus(transport, results[index].status),
      ),
    [transports, results],
  );

  return { data, ...rest };
}
