import { Stack } from 'expo-router'

// 여행 상세는 탭 묶음((detail))과 그 위에 쌓이는 화면(메모 상세·수정)으로 나뉜다.
// 탭 헤더는 (detail) 이 갖고, 쌓이는 화면은 자기 헤더를 직접 그린다.
export default function TripDetailStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
