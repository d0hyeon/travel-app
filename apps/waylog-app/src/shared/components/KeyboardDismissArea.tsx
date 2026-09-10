import { Keyboard } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useMemo } from 'react'

// 웹은 입력 밖을 누르면 포커스가 풀려 키보드가 내려간다. RN 의 View 는 터치
// responder 가 없어 빈 자리를 눌러도 아무 데도 닿지 않으므로 최상위에서 한 번 받는다.
export function KeyboardDismissArea({ children }: { children: React.ReactNode }) {
  // 눌린 자리가 입력을 가진 화면인지와 무관하게 포커스만 푼다. Tap 은 터치를
  // 소비하지 않아 아래의 버튼·스크롤은 그대로 자기 몫을 가져간다.
  const dismiss = useMemo(() => Gesture.Tap().onEnd(() => Keyboard.dismiss()).runOnJS(true), [])

  return <GestureDetector gesture={dismiss}>{children}</GestureDetector>
}
