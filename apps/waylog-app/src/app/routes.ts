// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- 화면별 declare module 병합 대상
export interface RouteParamsRegistry {}

// RouteParamsRegistry는 declaration merging 대상이라 인덱스 시그니처가 없다.
// react-navigation의 ParamListBase(Record<string, object | undefined>) 제약을
// 만족시키기 위해 여기서만 인덱스 시그니처를 더해 합성한다.
export type RootStackParamList = RouteParamsRegistry & Record<string, object | undefined>

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
