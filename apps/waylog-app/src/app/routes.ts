// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- 화면별 declare module 병합 대상
export interface RouteParamsRegistry {}

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
