import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack, type StackProps } from '~/shared/components/design-system'
import { palette, zLayer } from '../config/tokens'

// 웹 BottomArea 와 같은 역할이다. env(safe-area-inset-bottom) 대신
// safe-area-context 로 하단 여백을 받는다.
export function BottomArea({
  bottom,
  style,
  // RN 에는 fixed 가 없다. 화면 하단 고정은 부모 기준 absolute 로 대신한다.
  position,
  ...props
}: StackProps & { bottom?: number; position?: 'fixed' | 'static' }) {
  const insets = useSafeAreaInsets()

  return (
    <Stack
      direction="row"
      gap={1}
      style={[
        [styles.stack, {
          paddingBottom: position === 'static' ? (bottom ?? 8) : (bottom ?? 8) + insets.bottom, ...(position === 'fixed'
            ? ({ position: 'absolute', bottom: 0, left: 0, right: 0 } as const)
            : {})
        }],
        style,
      ]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  stack: {
    padding: 8,
    width: '100%',

    zIndex: zLayer.bottomArea,
  },
})
