import {
  FlightStatusKind,
  toDelayMinutes,
  type FlightStatus,
} from "../flight-status";
import type {
  ScheduledTripTransport,
  TripTransport,
  TripTransportTicket,
  TripTransportType,
} from "./tripTransport.types";

// 타임존 값은 1차에서 채우지 않으므로 없으면 기기 로컬로 폴백한다.
// date-fns 는 이름이 주어져도 타임존 변환을 하지 못해 Intl 을 쓴다.
function formatInTimezone(
  isoString: string,
  timezone: string | undefined,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: timezone,
    ...options,
  }).format(new Date(isoString));
}

export function formatDepartureTime(transport: TripTransport): string {
  return formatInTimezone(transport.departureAt, transport.departureTimezone, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatArrivalTime(
  transport: TripTransport,
): string | undefined {
  if (transport.arrivalAt == null) return undefined;

  return formatInTimezone(transport.arrivalAt, transport.arrivalTimezone, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// 종류마다 운항 정보가 담긴 필드가 다르다. 어느 필드를 읽을지는 도메인이 알고,
// 어떻게 늘어놓을지는 화면이 정한다.
export interface TripTransportCarrierInfo {
  name: string | undefined;
  number: string | undefined;
}

export function getCarrierInfo(
  transport: TripTransport,
): TripTransportCarrierInfo {
  if (transport.type === "flight") {
    return { name: transport.airline, number: transport.flightNumber };
  }

  return { name: undefined, number: undefined };
}

// 터미널·게이트·좌석은 모두 탑승권에 인쇄된 값이다. 종류마다 인쇄되는
// 항목과 부르는 이름이 다르다 -- 기차·버스 승차권은 게이트를 찍지 않고,
// 터미널 자리에 승강장을 찍는다.
export interface TripTransportOperationalField {
  name: "terminal" | "gate" | "seat";
  label: string;
}

const SEAT_FIELD: TripTransportOperationalField = {
  name: "seat",
  label: "좌석(나)",
};

export function getOperationalFields(
  type: TripTransportType,
): readonly TripTransportOperationalField[] {
  if (type === "flight") {
    return [
      { name: "terminal", label: "터미널" },
      { name: "gate", label: "게이트" },
      SEAT_FIELD,
    ];
  }

  return [{ name: "terminal", label: "플랫폼" }, SEAT_FIELD];
}

// 출발·도착이 각자의 타임존에서 다른 날인지 본다.
// UTC 로는 같은 날이어도 지점이 다르면 날이 갈린다.
export function isOvernightArrival(transport: TripTransport): boolean {
  if (transport.arrivalAt == null) return false;

  const departureDate = toDateKey(
    transport.departureAt,
    transport.departureTimezone,
  );
  const arrivalDate = toDateKey(transport.arrivalAt, transport.arrivalTimezone);

  return departureDate !== arrivalDate;
}

// en-CA 로케일이 YYYY-MM-DD 를 내므로 조립 없이 날짜 키를 얻는다.
function toDateKey(isoString: string, timezone: string | undefined): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoString));
}

export interface TripTransportDateGroup<T extends TripTransport = TripTransport> {
  date: string;
  transports: T[];
}

export function groupByDepartureDate<T extends TripTransport>(
  transports: T[],
  timezone?: string,
): TripTransportDateGroup<T>[] {
  const groups: TripTransportDateGroup<T>[] = [];

  for (const transport of transports) {
    const date = toDateKey(
      transport.departureAt,
      timezone ?? transport.departureTimezone,
    );
    const lastGroup = groups.at(-1);

    if (lastGroup?.date === date) {
      lastGroup.transports.push(transport);
      continue;
    }

    groups.push({ date, transports: [transport] });
  }

  return groups;
}

export function splitByDeparture<T extends TripTransport>(
  transports: T[],
  now: Date,
): { past: T[]; upcoming: T[] } {
  const departedAt = (transport: T) =>
    new Date(transport.departureAt).getTime();
  const boundary = now.getTime();

  return {
    // 지난 것은 방금 끝난 것부터 본다.
    past: transports
      .filter((x) => departedAt(x) < boundary)
      .toSorted((a, b) => departedAt(b) - departedAt(a)),
    upcoming: transports
      .filter((x) => departedAt(x) >= boundary)
      .toSorted((a, b) => departedAt(a) - departedAt(b)),
  };
}

// 내 티켓이 없으면 일행 공용 티켓으로 폴백한다.
export function findMyTicket(
  tickets: TripTransportTicket[],
  memberId: string | undefined,
): TripTransportTicket | undefined {
  const mine = tickets.find(
    (x) => x.memberId != null && x.memberId === memberId,
  );
  if (mine != null) return mine;

  return tickets.find((x) => x.memberId == null);
}

export function hasOnlySharedTickets(tickets: TripTransportTicket[]): boolean {
  return tickets.length > 0 && tickets.every((x) => x.memberId == null);
}

const TICKET_STORAGE_PREFIX = "trip-transport-tickets/";

export function getTicketStoragePath(imageUrl: string): string | undefined {
  const prefixIndex = imageUrl.indexOf(TICKET_STORAGE_PREFIX);
  if (prefixIndex === -1) return undefined;

  return imageUrl.slice(prefixIndex).split("?")[0];
}

const KINDS_WITHOUT_ARRIVAL_ESTIMATE: readonly FlightStatusKind[] = [
  FlightStatusKind.결항,
  FlightStatusKind.회항,
];

function getArrivalDelayMinutes(
  arrivalAt: string | undefined,
  status: FlightStatus,
): number | null {
  if (arrivalAt == null) return null;
  if (KINDS_WITHOUT_ARRIVAL_ESTIMATE.includes(status.kind)) return null;

  return toDelayMinutes(status);
}

export function applyFlightStatus(
  transport: TripTransport,
  status: FlightStatus | null,
): ScheduledTripTransport {
  if (status == null) return transport;

  const departureAt =
    status.estimatedAt ?? status.scheduledAt ?? transport.departureAt;
  const arrivalDelayMinutes = getArrivalDelayMinutes(transport.arrivalAt, status);
  if (arrivalDelayMinutes == null || transport.arrivalAt == null) {
    return { ...transport, departureAt };
  }

  const delayedArrivalAt = new Date(
    new Date(transport.arrivalAt).getTime() + arrivalDelayMinutes * 60_000,
  ).toISOString();

  return {
    ...transport,
    departureAt,
    arrivalAt: delayedArrivalAt,
    arrivalDelayMinutes,
  };
}
