import { josa } from "@waylog/utility";
import { FlightStatusKind } from "./flightStatusKind";

export interface WatchedStatus {
  kind: string;
  estimatedAt: string | null;
  gate: string | null;
}

export interface NotifiedStatus {
  lastNotifiedKind: string | null;
  lastNotifiedEstimatedAt: string | null;
  lastNotifiedGate: string | null;
}

// 알림을 보낼 상태는 셋뿐이다. 출발·도착은 이미 일어난 일이라 늦고,
// 예정은 알릴 것이 없다. 지연이 풀려도 알리지 않는다.
const NOTIFIABLE: readonly string[] = [
  FlightStatusKind.지연,
  FlightStatusKind.결항,
  FlightStatusKind.회항,
];

export function getIsNotifiable(kind: string) {
  return NOTIFIABLE.includes(kind);
}

const STATUS_LABEL: Record<string, string> = {
  [FlightStatusKind.예정]: "정상 운항 예정",
  [FlightStatusKind.출발]: "출발",
  [FlightStatusKind.도착]: "도착",
};

/**
 * 이번 확인에서 알림을 보내야 하는지 답한다.
 *
 * 5분마다 도는 cron 이라 "지연"이 유지되는 동안 매번 참이 되면 사용자는
 * 같은 알림을 수십 번 받는다. 직전에 보낸 상태와 비교해 달라졌을 때만 보낸다.
 *
 * 지연은 시각이 또 밀릴 수 있어, 상태가 같아도 estimatedAt 이 바뀌면 보낸다.
 */
export interface ShouldNotifyOptions {
  /**
   * 상태와 무관하게 매번 보낸다. 발송 경로를 실기기로 확인할 때만 쓴다.
   *
   * 켜면 5분마다 같은 알림이 오고 정상 운항편도 알린다. 운영에서 켜면
   * 사용자가 알림을 꺼버려 지연을 영영 못 받는다.
   */
  notifyAlways?: boolean;
}

const GATE_WATCHABLE: readonly string[] = [
  FlightStatusKind.예정,
  FlightStatusKind.지연,
];

// 탑승구는 배정 후에도 바뀔 수 있다. 출발 전(예정·지연)에만 의미가 있고,
// 결항·회항·출발·도착 이후엔 알려도 늦거나 무의미하다.
export function getIsGateChanged(
  current: WatchedStatus,
  previousGate: string | null,
  notified: NotifiedStatus,
) {
  if (!GATE_WATCHABLE.includes(current.kind)) return false;
  if (current.gate == null || current.gate === "") return false;
  if (previousGate == null || previousGate === "") return false;
  if (current.gate === previousGate) return false;

  return current.gate !== notified.lastNotifiedGate;
}

export function getShouldNotify(
  current: WatchedStatus,
  previousGate: string | null,
  notified: NotifiedStatus,
  { notifyAlways = false }: ShouldNotifyOptions = {},
) {
  if (notifyAlways) return true;

  if (getIsGateChanged(current, previousGate, notified)) return true;

  if (!getIsNotifiable(current.kind)) return false;

  if (current.kind !== notified.lastNotifiedKind) return true;

  return (
    current.kind === FlightStatusKind.지연 &&
    !getIsSameInstant(current.estimatedAt, notified.lastNotifiedEstimatedAt)
  );
}

function getIsSameInstant(left: string | null, right: string | null) {
  if (left == null || right == null) return left === right;

  return new Date(left).getTime() === new Date(right).getTime();
}

function toClock(value: string | null) {
  if (value == null) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export interface NotificationText {
  title: string;
  body: string;
}

export interface WatchedFlight {
  airline: string;
  flightNumber: string;
  /** 도착 공항의 도시명. "{항공사} {도시명}행 (편명)" 형태로 제목에 쓴다. */
  arrivalCityName: string;
}

function toTitle(flight: WatchedFlight, label: string) {
  return `${flight.airline} ${flight.arrivalCityName}행 (${flight.flightNumber}편) ${label}`;
}

// 탑승구는 kind 와 독립으로 바뀐다. 지연·결항 등 다른 사유로 이미 보내는
// 본문 뒤에 한 줄 덧붙여, 같은 확인 주기에 두 알림이 겹쳐 오지 않게 한다.
function withGateChangedBody(text: NotificationText, status: WatchedStatus, isGateChanged: boolean) {
  if (!isGateChanged || status.gate == null) return text;

  return { ...text, body: `${text.body} 탑승구가 ${josa(status.gate, "으로/로")} 변경됐어요.` };
}

export function toNotificationText(
  flight: WatchedFlight,
  status: WatchedStatus,
  isGateChanged = false,
): NotificationText {
  if (status.kind === FlightStatusKind.결항) {
    return withGateChangedBody(
      {
        title: toTitle(flight, "결항"),
        body: "항공편이 결항됐어요. 일정을 확인해 주세요.",
      },
      status,
      isGateChanged,
    );
  }

  if (status.kind === FlightStatusKind.회항) {
    return withGateChangedBody(
      {
        title: toTitle(flight, "회항"),
        body: "항공편이 회항했어요. 일정을 확인해 주세요.",
      },
      status,
      isGateChanged,
    );
  }

  if (status.kind === FlightStatusKind.지연) {
    const clock = toClock(status.estimatedAt);
    return withGateChangedBody(
      {
        title: toTitle(flight, "지연"),
        body:
          clock == null
            ? "항공편이 지연됐어요."
            : `출발이 ${clock} 으로 변경됐어요.`,
      },
      status,
      isGateChanged,
    );
  }

  // 예정편에서 게이트만 바뀐 경우. notifyAlways 가 아니면 게이트 변경
  // 말고는 예정편을 알릴 일이 없으므로 여기 닿으면 곧 게이트 문구다.
  if (status.kind === FlightStatusKind.예정 && isGateChanged && status.gate != null) {
    return {
      title: toTitle(flight, "탑승구 변경"),
      body: `탑승구가 ${josa(status.gate, "으로/로")} 변경됐어요.`,
    };
  }

  // notifyAlways 로만 닿는 자리다. 정상 운항편을 알릴 일은 평소에 없다.
  const label = STATUS_LABEL[status.kind] ?? status.kind;
  return {
    title: toTitle(flight, label),
    body: `현재 상태는 '${label}' 이에요.`,
  };
}
