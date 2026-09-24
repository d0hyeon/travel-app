import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { RootStackParamList, TripDetailTabParamList } from '../../app/routes'

export function useAppNavigation<T extends keyof RootStackParamList = keyof RootStackParamList>() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList, T>>()
}

export function useAppRoute<T extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, T>>()
}

// TripDetail 탭(정보/장소/계획/정산/사진) 내부에서만 쓰는 탭 스코프 전용 오버로드.
// RootStackParamList 훅과 이름이 겹치지 않게 별도로 둔다 — 탭 내부 컴포넌트가 실수로
// 스택 레벨 네비게이터를 잡아 상위 화면으로 잘못 navigate 하는 걸 타입으로 막는다.
export function useTripDetailTabNavigation<T extends keyof TripDetailTabParamList = keyof TripDetailTabParamList>() {
  return useNavigation<BottomTabNavigationProp<TripDetailTabParamList, T>>()
}

export function useTripDetailTabRoute<T extends keyof TripDetailTabParamList>() {
  return useRoute<RouteProp<TripDetailTabParamList, T>>()
}
