import { useSuspenseQuery } from "@waylog/react";
import { getFlightStatusProviders } from "./flightStatus.utils";
import type {
  FlightStatus,
  FlightStatusProvider,
  GetFlightStatusParams,
} from "./flightStatus.types";

const REFETCH_INTERVAL = 3 * 60 * 1000;

export type FlightQuery = Partial<GetFlightStatusParams>;

// 선택 축과 가용성 축이 다르다. 공항으로 provider 를 고르고,
// provider 가 자기 기간 제약을 답한다. 날씨의 분리를 그대로 승계한다.
function findProvider(query: FlightQuery) {
  return getFlightStatusProviders().find(({ supportedAirportCodes }) =>
    supportedAirportCodes.some(
      (code) =>
        code === query.departureAirportCode ||
        code === query.arrivalAirportCode,
    ),
  );
}

function getIsComplete(query: FlightQuery): query is GetFlightStatusParams {
  return (
    query.airlineCode != null &&
    query.flightNumber != null &&
    query.departureAirportCode != null &&
    query.arrivalAirportCode != null &&
    query.departureAt != null
  );
}

// 조회할 곳이 있는지는 훅의 지식이다 -- 호출부가 매번 다시 묻지 않는다.
// 순수 판단이라 export 해 단위 테스트한다.
export function getIsQueryable(
  query: FlightQuery,
): query is GetFlightStatusParams {
  return findProvider(query) != null && getIsComplete(query);
}

export interface FlightStatusResult {
  status: FlightStatus | null;
  provider?: string;
  isSupported: boolean;
  isAvailable: boolean;
}

/**
 * 여러 편의 운항 상태를 한 번에 조회한다.
 *
 * 목록 API 가 공항 하루치를 통째로 주므로 편마다 조회하면 같은 응답을
 * 편 수만큼 받는다. 목록은 한 번만 받고 편은 그 위에서 고른다.
 *
 * 결과는 물어본 순서 그대로다.
 */
export function useFlightStatuses(
  queries: readonly FlightQuery[],
): FlightStatusResult[] {
  const [listProvider] = getFlightStatusProviders();

  // 목록은 편마다 따로 받지 않고 하루치를 통째로 받는다. 그래서 "받을지
  // 말지"는 배열 전체에 하나 -- 한 편이라도 조회 가능하면 받는다.
  // "이 편이 그 목록에서 실제로 나오는지"는 아래 map 에서 편별로 다시 본다.
  const isEnabled = queries.some(getIsQueryable);

  const { data: schedules } = useSuspenseQuery({
    queryKey: useFlightStatuses.key(),
    enabled: isEnabled,
    refetchInterval: REFETCH_INTERVAL,
    queryFn: () => listProvider.getFlightSchedules(),
  });

  return queries.map((query) => {
    const provider = findProvider(query);
    const isComplete = getIsComplete(query);
    const isSupported = provider != null && isComplete;
    const isAvailable =
      isSupported && provider.getIsAvailability(query.departureAt);

    return {
      status:
        isAvailable && schedules != null
          ? provider.findFlightStatus(schedules, query)
          : null,
      provider: provider?.provider,
      isSupported,
      isAvailable,
    };
  });
}

useFlightStatuses.key = () => ["flight-schedules"];

export interface UseFlightStatusOptions {
  /**
   * false 를 주면 이 쿼리로 조회 가능한지와 무관하게 조회하지 않는다.
   * 호출부가 "이 편은 항공이 아니다"처럼 조회 자체가 무의미함을
   * 이미 알 때 쓴다. 기본값은 true.
   */
  enabled?: boolean;
}

export function useFlightStatus(
  params: FlightQuery,
  options?: UseFlightStatusOptions,
): FlightStatusResult {
  const query = options?.enabled === false ? {} : params;
  const [result] = useFlightStatuses([query]);
  return result;
}

useFlightStatus.key = useFlightStatuses.key;
