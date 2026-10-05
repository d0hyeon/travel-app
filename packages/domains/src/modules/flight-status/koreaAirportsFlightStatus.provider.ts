import type { AirportCode } from "../airport";
import type { FlightStatusProvider } from "./flightStatus.types";

const KOREA_AIRPORT_CODES = [
  "CJU",
  "GMP",
  "PUS",
  "CJJ",
  "TAE",
  "KWJ",
  "USN",
  "HIN",
  "RSU",
  "KPO",
  "KUV",
  "YNY",
  "WJU",
] as const;
const PAST_DAYS = 3;
const FUTURE_DAYS = 7;

function getIsAvailability(departureAt: string) {
  const departure = new Date(departureAt);
  if (Number.isNaN(departure.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = new Date(today);
  from.setDate(from.getDate() - PAST_DAYS);

  const limit = new Date(today);
  limit.setDate(limit.getDate() + FUTURE_DAYS);

  return departure >= from && departure < limit;
}

export const koreaAirportsFlightStatusProvider: FlightStatusProvider = {
  provider: "한국공항공사",
  supportedAirportCodes: KOREA_AIRPORT_CODES as readonly AirportCode[],
  getIsAvailability,
};
