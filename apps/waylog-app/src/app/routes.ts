// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- 화면별 declare module 병합 대상
export interface RouteParamsRegistry {}

// RouteParamsRegistry(interface)는 명시적 인덱스 시그니처가 없어 react-navigation의
// ParamListBase(Record<string, object | undefined>) 제약을 그대로는 만족하지 못한다.
// 매핑 타입으로 재구성하면 키 집합은 닫힌 채로 유지하면서 암묵적 인덱스 시그니처
// 호환성을 얻어 ParamListBase에 할당 가능해진다(Record<string, ...>로 넓히지 않는다).
export type RootStackParamList = { [K in keyof RouteParamsRegistry]: RouteParamsRegistry[K] }

export type HomeTabParamList = {
  MyTrips: undefined
  Feed: undefined
  Explorer: undefined
  Profile: undefined
}

export type TripDetailTabParamList = {
  TripInfo: { tripId: string; 'info-tab'?: string }
  TripPlace: { tripId: string }
  TripRoute: { tripId: string; days?: string; 'route-id'?: string }
  TripExpense: { tripId: string }
  TripPhoto: { tripId: string }
}
