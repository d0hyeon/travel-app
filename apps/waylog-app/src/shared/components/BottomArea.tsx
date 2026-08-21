import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, type StackProps } from './mui'
import { palette } from '../config/tokens'

// 웹 BottomArea 와 같은 역할이다. env(safe-area-inset-bottom) 대신
// safe-area-context 로 하단 여백을 받는다.
export function BottomArea({
  bottom,
  sx,
  // 웹은 fixed/static 을 구분하지만 RN 에서는 부모 레이아웃이 결정한다.
  position,
  ...props
}: StackProps & { bottom?: number; position?: 'fixed' | 'static' }) {
  const insets = useSafeAreaInsets()

  return (
    <Stack
      direction="row"
      gap={1}
      sx={{
        padding: 8,
        // 웹은 fixed 로 띄울 때만 safe-area 를 더한다.
        // 흐름에 놓인 static 은 부모가 이미 안전영역을 피해 있어 더하면 과하다.
        paddingBottom: position === 'static' ? (bottom ?? 8) : (bottom ?? 8) + insets.bottom,
        width: '100%',
        backgroundColor: palette.background,
        zIndex: 10,
        ...(sx ?? {}),
      }}
      {...props}
    />
  )
}
