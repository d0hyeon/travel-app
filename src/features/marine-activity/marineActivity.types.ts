import type { Coordinate } from "~shared/types/coordinate";

export const MarineActivityType = {
  Beach: "beach",
  SkinScuba: "skinScuba",
} as const;

export type MarineActivityType =
  (typeof MarineActivityType)[keyof typeof MarineActivityType];

export const MarineActivityGrade = {
  VeryGood: "veryGood",
  Good: "good",
  Normal: "normal",
  Bad: "bad",
  VeryBad: "veryBad",
  Unknown: "unknown",
} as const;

export type MarineActivityGrade =
  (typeof MarineActivityGrade)[keyof typeof MarineActivityGrade];

export const MarineActivityDisableReason = {
  NotMarineDestination: "NOT_MARINE_DESTINATION",
  OverseasDestination: "OVERSEAS_DESTINATION",
  UnsupportedPlace: "UNSUPPORTED_PLACE",
  OutOfForecastRange: "OUT_OF_FORECAST_RANGE",
} as const;

export type MarineActivityDisableReason =
  (typeof MarineActivityDisableReason)[keyof typeof MarineActivityDisableReason];

export interface MarineActivityMetrics {
  waterTemperatureCelsius: number | null;
  waveHeightMeters: number | null;
  windSpeedMetersPerSecond: number | null;
  airTemperatureCelsius: number | null;
  currentSpeedMetersPerSecond: number | null;
  tideLabel: string | null;
}

export interface MarineActivityIndex {
  type: MarineActivityType;
  date: string;
  placeCode: string;
  placeName: string;
  coordinate: Coordinate;
  distanceMeters: number;
  grade: MarineActivityGrade;
  gradeLabel: string;
  score: number | null;
  observedAt: string | null;
  metrics: MarineActivityMetrics;
}

export interface DailyMarineActivityIndices {
  date: string;
  coordinate: Coordinate;
  indices: MarineActivityIndex[];
}

export interface MarineActivityMarkerItem {
  placeCode: string;
  placeName: string;
  coordinate: Coordinate;
  indices: MarineActivityIndex[];
}

export interface MarineActivityEligibility {
  isEligible: boolean;
  reason: MarineActivityDisableReason | null;
}
