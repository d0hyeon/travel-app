import { useSuspenseQuery } from "@tanstack/react-query";
import { getAirports } from "./airport.api";
import { searchAirports } from "./airport.utils";
import type { Airport } from "./airport.types";

const AIRPORTS_KEY = ["airports"];
// 정적 참조 데이터라 세션 동안 다시 조회할 이유가 없다.
const STALE_TIME_MS = Infinity;

export function useAirports() {
  return useSuspenseQuery({
    queryKey: AIRPORTS_KEY,
    queryFn: getAirports,
    staleTime: STALE_TIME_MS,
  });
}
useAirports.key = AIRPORTS_KEY;

export function useAirport(code: string): Airport | undefined {
  const { data: airports } = useAirports();
  return airports.find((airport) => airport.code === code);
}
useAirport.key = AIRPORTS_KEY;

export function useAirportSearch(keyword: string): Airport[] {
  const { data: airports } = useAirports();
  return searchAirports(airports, keyword);
}
useAirportSearch.key = AIRPORTS_KEY;
