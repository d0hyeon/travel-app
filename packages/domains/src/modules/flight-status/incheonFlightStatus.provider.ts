import type { AirportCode } from "../airport";
import type { FlightStatusProvider } from "./flightStatus.types";

const INCHEON_AIRPORT_CODE = "ICN";
const AVAILABLE_DAYS = 7;

// 인천은 D+0~D+6 만 준다. 그 밖이면 서버가 저장한 상태도 없어 묻지 않는다.
function getIsAvailability(departureAt: string) {
  const departure = new Date(departureAt);
  if (Number.isNaN(departure.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limit = new Date(today);
  limit.setDate(limit.getDate() + AVAILABLE_DAYS);

  return departure >= today && departure < limit;
}

export const incheonFlightStatusProvider: FlightStatusProvider = {
  provider: "인천국제공항공사",
  supportedAirportCodes: [INCHEON_AIRPORT_CODE] as readonly AirportCode[],
  getIsAvailability,
};
