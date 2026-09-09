import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import type { PropsWithChildren, ReactNode } from 'react'
import { StyleSheet, Pressable, View } from 'react-native'
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
  const extrude = useExtrude({ active: isScrollDown, axis: extrudeAxis })

  return (
    <>
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
    </>
  )
}

const styles = StyleSheet.create({
  header: { height: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterSource: { overflow: 'visible' },
  filterTarget: { alignSelf: 'flex-start', flexGrow: 0, flexShrink: 0, position: 'absolute', left: 0, top: 0, paddingBottom: 8 },
})
