import type { PropsWithChildren } from 'react'
import { palette } from '../../shared/config/tokens'
import { View } from 'react-native'

/**
 * 웹 explorer-view/FilterNavigation의 네이티브 대응 컴포넌트.
 *
 * 헤더 다음 흐름에 그대로 놓인다.
 * 접히는 것은 자리(높이·구분선)뿐이고,
 * 자식은 Extrude가 헤더로 옮기므로 잘라내지 않는다.
 */
export function FilterNavigation({ children }: PropsWithChildren) {
  return (
    <View
      style={[
        {
          zIndex: 10,
          paddingHorizontal: 16,
          backgroundColor: palette.background,
          borderBottomWidth: 1,
          borderBottomColor: palette.divider,
        },
      ]}
    >
      {children}
    </View>
  )
}
