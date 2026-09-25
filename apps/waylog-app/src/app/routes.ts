// location/category/explorer-view-mode 는 3개 탐색 랭킹 화면이 공유하는
// useQueryParamState 기반 필터·뷰모드 파라미터다.
type ExplorerFilterParams = {
  location?: string
  category?: string
  'explorer-view-mode'?: string
}

export type RootStackParamList = {
  Login: { returnTo?: { screen: keyof RootStackParamList; params?: Record<string, unknown> } }
  Home: undefined
  TripDetail: { tripId: string }
  TripDetailChecklist: { tripId: string }
  TripMemoDetail: { tripId: string; memoId: string }
  TripMemoEdit: { tripId: string; memoId: string }
  TripCreate: { step?: string }
  TripInvite: { shareLink: string }
  ExplorerDetail: { placeId: string; tab?: string }
  ExplorerTopVisited: ExplorerFilterParams
  ExplorerRecentHot: ExplorerFilterParams
  ExplorerMostSaved: ExplorerFilterParams
  PostNew: { tripId?: string }
  PostDetail: { postId: string }
  UserProfile: { userId: string; tab?: string }
  TransportNew: { tripId: string }
  TransportDetail: { tripId: string; transportId: string }
}

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
