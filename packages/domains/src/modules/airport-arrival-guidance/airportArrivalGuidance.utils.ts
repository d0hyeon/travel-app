import {
  GateIdLabel,
  REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES,
  type AirportArrivalGuidance,
  type AirportArrivalGuidanceInput,
  type AirportCongestionDepartureGate,
  type AirportCongestionTier,
  type CongestionTierInput,
  type DepartureTerminalTicket,
  type RecommendedDepartureGateInput,
} from "./airportArrivalGuidance.types";

export function getConsistentDepartureTerminal(
  tickets: readonly DepartureTerminalTicket[],
): string | null {
  if (tickets.length === 0) return null;

  const terminals = tickets.map((ticket) => ticket.terminal?.trim());
  // 하나라도 터미널이 비어 있으면 전체를 제외한다. 일부만 입력된 상태를
  // "입력된 값만 보고 하나로 일치"로 착각하면 실제로는 미입력 탑승자가 있다.
  if (terminals.some((terminal) => terminal == null || terminal === ""))
    return null;

  const uniqueTerminals = new Set(terminals);
  if (uniqueTerminals.size !== 1) return null;

  const [terminal] = uniqueTerminals;
  return terminal as string;
}

export function getCongestionTier(
  input: CongestionTierInput,
): AirportCongestionTier {
  const ratio = input.passengerCount / input.referencePassengerCount;

  if (ratio <= input.policy.calmMaxRatio) return "calm";
  if (ratio <= input.policy.normalMaxRatio) return "normal";
  if (ratio <= input.policy.crowdedMaxRatio) return "crowded";
  return "veryCrowded";
}

const EXTRA_MINUTES_BY_TIER: Record<
  AirportCongestionTier,
  keyof AirportArrivalGuidanceInput["policy"]
> = {
  calm: "calmExtraMinutes",
  normal: "normalExtraMinutes",
  crowded: "crowdedExtraMinutes",
  veryCrowded: "veryCrowdedExtraMinutes",
};

// 한국공항공사 API 는 출국장별 인원수가 아니라 혼잡도 레벨(1:원활~4:매우혼잡)만
// 준다. 레벨이 이미 등급이므로 비율 계산 없이 그대로 옮긴다.
// 문서: docs/superpowers/specs/2026-09-21-airport-arrival-guidance-design.md
const TIER_BY_DOMESTIC_LEVEL: Record<number, AirportCongestionTier> = {
  1: "calm",
  2: "normal",
  3: "crowded",
  4: "veryCrowded",
};

function getCongestionRatio(gate: AirportCongestionDepartureGate): number {
  return gate.passengerCount / gate.referencePassengerCount;
}

// domestic 은 이미 레벨(1~4) 값이라 비율이 아니라 값 자체가 등급이다.
// forecast·realtime 은 출국장마다 기준 승객 수가 달라, 원시 인원수가 아니라
// 기준 대비 비율로 비교해야 "가장 혼잡한/여유로운 출국장"이 맞는다.
function getMostCongestedGate(
  gates: readonly AirportCongestionDepartureGate[],
  isDomestic: boolean,
): AirportCongestionDepartureGate | null {
  if (gates.length === 0) return null;

  if (isDomestic) {
    return gates.reduce((most, gate) =>
      gate.passengerCount > most.passengerCount ? gate : most,
    );
  }

  return gates.reduce((most, gate) =>
    getCongestionRatio(gate) > getCongestionRatio(most) ? gate : most,
  );
}

export function getAirportArrivalGuidance(
  input: AirportArrivalGuidanceInput,
): AirportArrivalGuidance | null {
  if (input.isCancelled) return null;
  if (input.departureTerminal == null) return null;
  if (input.snapshot == null) return null;

  const appliedDepartureAt = input.estimatedDepartureAt ?? input.departureAt;
  if (new Date(appliedDepartureAt) <= new Date(input.now)) return null;

  const isDomestic = input.snapshot.sourceKind === "domestic";
  const mostCongestedGate = getMostCongestedGate(
    input.snapshot.departureGates,
    isDomestic,
  );
  if (mostCongestedGate == null) return null;

  const tier = isDomestic
    ? (TIER_BY_DOMESTIC_LEVEL[mostCongestedGate.passengerCount] ?? "calm")
    : getCongestionTier({
        passengerCount: mostCongestedGate.passengerCount,
        referencePassengerCount: mostCongestedGate.referencePassengerCount,
        policy: input.policy,
      });

  const baseBufferMinutes = input.isOverseas
    ? input.policy.internationalBaseBufferMinutes
    : input.policy.domesticBaseBufferMinutes;
  const congestionBufferMinutes = input.policy[EXTRA_MINUTES_BY_TIER[tier]];

  const recommendedArrivalAt = new Date(
    new Date(appliedDepartureAt).getTime() -
      (baseBufferMinutes + congestionBufferMinutes) * 60 * 1000,
  ).toISOString();

  return {
    recommendedArrivalAt,
    appliedDepartureAt,
    terminal: input.departureTerminal,
    baseBufferMinutes,
    congestionBufferMinutes,
    congestionTier: tier,
    sourceKind: isDomestic ? "domestic" : "forecast",
    observedAt: input.snapshot.observedAt,
  };
}

function getLeastCongestedGate(
  gates: readonly AirportCongestionDepartureGate[],
): AirportCongestionDepartureGate | null {
  if (gates.length === 0) return null;

  // 실시간 출국장 추천은 항상 forecast·realtime 소스라 비율로 비교한다.
  return gates.reduce((least, gate) =>
    getCongestionRatio(gate) < getCongestionRatio(least) ? gate : least,
  );
}

/**
 * 권장 도착 시각이 가까워진 뒤에만 현재 가장 여유로운 출국장을 추천한다.
 *
 * 실시간 데이터는 미래 예측에 쓰지 않는다는 정책 때문에 별도 함수로 둔다 --
 * getAirportArrivalGuidance 는 미래 시각 계산만 하고, 이 함수는 "지금"만 본다.
 */
export function getRecommendedDepartureGate(
  input: RecommendedDepartureGateInput,
): AirportArrivalGuidance["recommendedDepartureGate"] {
  if (input.realtimeSnapshot == null) return undefined;

  const minutesUntilRecommended =
    (new Date(input.recommendedArrivalAt).getTime() -
      new Date(input.now).getTime()) /
    (60 * 1000);
  if (minutesUntilRecommended > REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES)
    return undefined;

  const leastCongestedGate = getLeastCongestedGate(
    input.realtimeSnapshot.departureGates,
  );
  if (leastCongestedGate == null) return undefined;

  return {
    gate: leastCongestedGate.gate,
    observedAt: input.realtimeSnapshot.observedAt,
  };
}

export function toDepartureGateLabel(gateId: string): string {
  return GateIdLabel[gateId as keyof typeof GateIdLabel] ?? gateId;
}
