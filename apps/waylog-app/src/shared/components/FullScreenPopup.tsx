import { useEffect, type ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette } from '../config/tokens'

// 웹 shared/components/FullScreenPopup 와 같은 공개 인터페이스를 유지한다.
export interface FullScreenPopupProps {
  isOpen?: boolean
  onClose?: () => void
  children?: ReactNode
}

const DURATION = 250

export function FullScreenPopup({ isOpen, onClose, children }: FullScreenPopupProps) {
  const insets = useSafeAreaInsets()

  // 웹은 translateY(20%) + opacity 로 올라온다. 같은 모션을 쓴다.
  const progress = useSharedValue(0)

  useEffect(() => {
    if (isOpen !== false) {
      progress.set(withTiming(1, { duration: DURATION }))
      return
    }

    // 닫는 모션이 끝난 뒤에만 밖에 알린다.
    progress.set(
      withTiming(0, { duration: DURATION }, (finished) => {
        if (finished && onClose != null) runOnJS(onClose)()
      }),
    )
  }, [isOpen])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * 60 }],
  }))

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: palette.background,
          paddingTop: insets.top,
          flexDirection: 'column',
        },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  )
}
