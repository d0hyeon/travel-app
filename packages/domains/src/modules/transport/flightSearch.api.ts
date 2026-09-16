// FlightAware AeroAPI v4 GET /flights/{ident} 의 응답 일부를 그대로 본뜬다.
// 실제 연동 시 이 모양 그대로 오므로 소비처를 고치지 않는다.
//
// 좌표를 주지 않는 것도 실제와 같다 -- AeroAPI 의 FlightAirportRef 는
// code·name·city·timezone 만 준다. 공항을 trip_place 로 만들려면
// 이름으로 장소 검색을 한 번 더 해야 한다.
export interface FlightSearchAirport {
  code_iata: string
  name: string
  city: string
  /** IANA. 실제 API 가 이 포맷으로 준다. */
  timezone: string
}

export interface FlightSearchResult {
  ident_iata: string
  operator_iata: string
  /** API 는 IATA 코드만 준다. 표시명은 코드에서 찾는다. */
  operatorName: string
  origin: FlightSearchAirport
  destination: FlightSearchAirport
  /** 예정 게이트 출발. UTC ISO. */
  scheduled_out: string
  /** 예정 게이트 도착. UTC ISO. */
  scheduled_in: string
}

const MOCK_RESULTS: FlightSearchResult[] = [
  {
    ident_iata: 'KE721',
    operator_iata: 'KE',
    operatorName: '대한항공',
    origin: { code_iata: 'ICN', name: '인천국제공항', city: '서울', timezone: 'Asia/Seoul' },
    destination: { code_iata: 'KIX', name: '간사이국제공항', city: '오사카', timezone: 'Asia/Tokyo' },
    scheduled_out: '2026-03-01T00:10:00Z',
    scheduled_in: '2026-03-01T01:45:00Z',
  },
  {
    ident_iata: 'OZ1155',
    operator_iata: 'OZ',
    operatorName: '아시아나항공',
    origin: { code_iata: 'ICN', name: '인천국제공항', city: '서울', timezone: 'Asia/Seoul' },
    destination: { code_iata: 'KIX', name: '간사이국제공항', city: '오사카', timezone: 'Asia/Tokyo' },
    scheduled_out: '2026-03-01T04:40:00Z',
    scheduled_in: '2026-03-01T06:10:00Z',
  },
]

/** 목업이다. 외부 API 연동은 정의서 3단계로, 키·과금 정책이 함께 필요하다. */
export async function searchFlights(keyword: string): Promise<FlightSearchResult[]> {
  const trimmed = keyword.trim().toUpperCase()
  if (trimmed === '') return []

  return MOCK_RESULTS.filter(
    (flight) => flight.ident_iata.includes(trimmed) || flight.operatorName.includes(keyword.trim()),
  )
}
