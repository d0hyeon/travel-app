import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList, TripDetailTabParamList } from '~app/routes'

export function useAppNavigation<T extends keyof RootStackParamList = keyof RootStackParamList>() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList, T>>()
}

export function useAppRoute<T extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, T>>()
}

// TripDetail 탭(정보/장소/계획/정산/사진) 내부에서 자기 탭의 params(days, route-id, info-tab
// 등)를 읽을 때 쓴다. 탭 안에서 스택 레벨 화면으로 이동할 때는 이 훅이 아니라 useAppNavigation을
// 쓴다 — react-navigation은 자식 네비게이터에서도 상위 스택 라우트로 바로 navigate할 수 있다.
export function useTripDetailTabRoute<T extends keyof TripDetailTabParamList>() {
  return useRoute<RouteProp<TripDetailTabParamList, T>>()
}
