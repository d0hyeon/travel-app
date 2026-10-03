import { reverseKeyValue } from "@waylog/utility";

// 공공데이터포털 인천공항 실시간 출국장 혼잡도 API 문서의 gateId 안내를 그대로 옮긴다.
// T1 은 출국장 1~6 을 동/서로, T2 는 출국장 1~2 를 A~D 구역으로 나눈다.
export const GateId = {
  "출국장 1 서쪽": "DG1_W",
  "출국장 1 동쪽": "DG1_E",
  "출국장 2 서쪽": "DG2_W",
  "출국장 2 동쪽": "DG2_E",
  "출국장 3 서쪽": "DG3_W",
  "출국장 3 동쪽": "DG3_E",
  "출국장 4 서쪽": "DG4_W",
  "출국장 4 동쪽": "DG4_E",
  "출국장 5 서쪽": "DG5_W",
  "출국장 5 동쪽": "DG5_E",
  "출국장 6 서쪽": "DG6_W",
  "출국장 6 동쪽": "DG6_E",
  "출국장 1A": "DG1_A",
  "출국장 1B": "DG1_B",
  "출국장 1C": "DG1_C",
  "출국장 1D": "DG1_D",
  "출국장 2A": "DG2_A",
  "출국장 2B": "DG2_B",
  "출국장 2C": "DG2_C",
  "출국장 2D": "DG2_D",
} as const;
export type GateId = (typeof GateId)[keyof typeof GateId];
export const GateIdLabel = reverseKeyValue(GateId);

export type AirportCongestionSourceKind = "forecast" | "realtime" | "domestic";
export type AirportCongestionTier =
  | "calm"
  | "normal"
  | "crowded"
  | "veryCrowded";
export type AirportArrivalNotificationJobStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "failed"
  | "cancelled";

export interface AirportArrivalGuidancePolicy {
  domesticBaseBufferMinutes: number;
  internationalBaseBufferMinutes: number;
  calmMaxRatio: number;
  normalMaxRatio: number;
  crowdedMaxRatio: number;
  calmExtraMinutes: number;
  normalExtraMinutes: number;
  crowdedExtraMinutes: number;
  veryCrowdedExtraMinutes: number;
}

export interface AirportCongestionDepartureGate {
  gate: string;
  passengerCount: number;
  referencePassengerCount: number;
}

export interface AirportCongestionSnapshot {
  sourceKind: AirportCongestionSourceKind;
  airportCode: string;
  terminal: string;
  observedAt: string;
  departureGates: readonly AirportCongestionDepartureGate[];
}

export interface CongestionTierInput {
  passengerCount: number;
  referencePassengerCount: number;
  policy: AirportArrivalGuidancePolicy;
}

export interface AirportArrivalGuidanceInput {
  departureAt: string;
  estimatedDepartureAt?: string;
  isCancelled: boolean;
  isOverseas: boolean;
  departureTerminal: string | null;
  now: string;
  policy: AirportArrivalGuidancePolicy;
  snapshot: AirportCongestionSnapshot | null;
}

export interface AirportArrivalGuidance {
  recommendedArrivalAt: string;
  appliedDepartureAt: string;
  terminal: string | null;
  baseBufferMinutes: number;
  congestionBufferMinutes: number;
  congestionTier: AirportCongestionTier;
  sourceKind: "forecast" | "domestic";
  observedAt: string;
  recommendedDepartureGate?: {
    gate: string;
    observedAt: string;
  };
}

// 도착 임박 여부 판단 뒤에만 쓴다. 미래 예측에는 실시간 데이터를 쓰지 않는다.
export const REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES = 120;

export interface RecommendedDepartureGateInput {
  recommendedArrivalAt: string;
  now: string;
  realtimeSnapshot: AirportCongestionSnapshot | null;
}

export interface AirportArrivalGuidanceQuery {
  tripId: string;
  transportId: string;
}

export interface AirportArrivalGuidancesQuery {
  tripId: string;
  transportIds: readonly string[];
}

export interface AirportArrivalGuidanceItem {
  transportId: string;
  guidance: AirportArrivalGuidance;
}

