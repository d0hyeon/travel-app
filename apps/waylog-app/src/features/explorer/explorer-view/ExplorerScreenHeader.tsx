import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import type { PropsWithChildren, ReactNode } from 'react'
import { StyleSheet, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated from 'react-native-reanimated'
import { useExtrude } from '../../../shared/components/animation/Extrude'
import { Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { ExplorerFilterBar } from '../explorer-filters/ExplorerFilterBar'
import { FilterNavigation } from './FilterNavigation'
import { ExplorerViewToggleButton } from './ExplorerViewToggleButton'
import type { ExplorerViewMode } from './useExplorerViewMode'

interface Props {
  title: string
  showBack?: boolean
  isScrollDown: boolean
  extrudeAxis?: 'x' | 'y' | 'both'
  viewMode: ExplorerViewMode
  onChangeViewMode: (value: ExplorerViewMode) => void
  filterExtras?: ReactNode
}

/**
 * 탐색 화면 공통 헤더 — 타이틀/뒤로가기/뷰모드 토글/필터바를 담는다.
 * 스크롤 시 타이틀이 필터 영역으로 이동하는 Extrude 애니메이션도 여기서 관리한다.
 *
 * 스크롤 흐름 위에 떠 있다.
 * 흐름 안에 두면 필터바가 접힐 때 스크롤 영역의 높이가 바뀌고,
 * 그 변화가 다시 스크롤 이벤트를 만들어 방향 판정이 튄다.
 */
export function ExplorerScreenHeader({
  title,
  showBack = false,
  isScrollDown,
  extrudeAxis = 'both',
  viewMode,
  onChangeViewMode,
  filterExtras,
}: PropsWithChildren<Props>) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const extrude = useExtrude({ active: isScrollDown, axis: extrudeAxis })

  return (
    <View style={[styles.overlay, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {showBack && (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={22} color={palette.text} />
            </Pressable>
          )}
          <Animated.View collapsable={false} ref={extrude.target.ref} style={extrude.target.style}>
            <Typography variant="h6">{title}</Typography>
          </Animated.View>
        </View>
        <ExplorerViewToggleButton value={viewMode} onChange={onChangeViewMode} />
      </View>

      <FilterNavigation>
        <Animated.View style={[styles.filterSource, extrude.placeholderStyle]}>
          <Animated.View
            collapsable={false}
            ref={extrude.source.ref}
            onLayout={extrude.source.onLayout}
            style={[
              styles.filterTarget,
              extrude.source.style,
            ]}
          >
            <ExplorerFilterBar>{filterExtras}</ExplorerFilterBar>
          </Animated.View>
        </Animated.View>
      </FilterNavigation>
    </View>
  )
}
/** 오버레이라 흐름에서 빠져 있다. 가려지는 만큼 스크롤 콘텐츠를 밀어낼 때 쓴다. */
ExplorerScreenHeader.HEIGHT = 84

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, backgroundColor: palette.background },
  header: { height: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterSource: { overflow: 'visible' },
  filterTarget: { alignSelf: 'flex-start', flexGrow: 0, flexShrink: 0, position: 'absolute', left: 0, top: 0, paddingBottom: 8 },
})
