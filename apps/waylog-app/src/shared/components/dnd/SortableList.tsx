import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Pressable, type FlatList } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import ReorderableList, {
  reorderItems,
  useIsActive,
  useReorderableDrag,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list'
import { Box, type BoxProps } from '../mui'
import { palette } from '../../config/tokens'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'

// 웹 dnd/SortableList 와 같은 공개 인터페이스를 유지한다.
// 내부는 @dnd-kit(DOM) 대신 react-native-reorderable-list 를 쓴다.
export type SortEvent<T> = { from: number; to: number; items: T[] }

// 핸들을 눌러 끌기까지의 지연.
const HANDLE_DRAG_ACTIVATION_DELAY_MS = 120

// pan 이 드래그를 넘겨받기까지의 지연. 핸들보다 "약간 길어야" 한다(라이브러리 README 지침).
// pan 은 기본적으로 손가락이 움직여야 활성화되는데, 그러면 들어올린 뒤 움직이지 않고
// 손을 떼었을 때 해제 신호(onFinalize)가 오지 않아 항목이 들린 채 남는다.
// 시간 기반으로 바꿔 움직임 없이도 활성화되게 한다.
const PAN_TAKEOVER_DELAY_MS = HANDLE_DRAG_ACTIVATION_DELAY_MS + 20

type Props<T extends { id: string }> = {
  items: T[]
  onSort?: (event: SortEvent<T>) => void
  renderItem?: (item: T, index: number) => ReactNode
  disabled?: boolean
  header?: ReactNode
  /** 목록 좌우 여백. 행과 헤더에 함께 적용된다. */
  paddingHorizontal?: number
  /** 이 id 의 항목이 보이도록 스크롤한다. 지도에서 장소를 고를 때 쓴다. */
  scrollToId?: string | null
  children?: ReactNode
}

// 핸들이 자기 행을 끌 수 있게 드래그 시작 함수를 내려준다.
const DragContext = createContext<(() => void) | null>(null)

export function SortableList<T extends { id: string }>({
  items: _items,
  onSort,
  renderItem,
  disabled,
  header,
  paddingHorizontal = 0,
  scrollToId,
}: Props<T>) {
  const [items, setItems] = useState(_items);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => setItems(_items), [_items])

  const listRef = useRef<FlatList<T>>(null)

  useEffect(() => {
    if (scrollToId == null) return

    const index = items.findIndex((item) => item.id === scrollToId)
    if (index < 0) return

    listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true })
  }, [scrollToId, items])
  const handleDragStart = ({ index }: { index: number }) => {
    'worklet'
    runOnJS(setActiveIndex)(index)
  }
  const handleDragEnd = () => {
    'worklet'
    runOnJS(setActiveIndex)(-1)
  }
  const dragPanGesture = useMemo(
    () => Gesture.Pan().activateAfterLongPress(PAN_TAKEOVER_DELAY_MS),
    [],
  )

  const handleReorder = ({ from, to }: ReorderableListReorderEvent) => {
    const next = reorderItems(items, from, to)
    setItems(next);
    onSort?.({ from, to, items: next })
  }

  return (
    <ReorderableList
      ref={listRef}
      data={items}
      keyExtractor={(item) => item.id}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40, paddingHorizontal }}
      ListHeaderComponent={header == null ? undefined : () => <>{header}</>}
      shouldUpdateActiveItem
      panGesture={dragPanGesture}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onReorder={handleReorder}
      // 행 높이가 제각각이라 목표 항목이 화면 밖이면 계산이 빗나간다. 근사 위치로 다시 잡는다.
      onScrollToIndexFailed={({ index, averageItemLength }) => {
        listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: true })
      }}
      renderItem={({ item, index }) => (
        <Row disabled={disabled} active={activeIndex === index}>{renderItem?.(item, index)}</Row>
      )}
    />
  )
}

// 셀 하나가 드래그 단위다. 여기서 얻은 시작 함수를 핸들에 내려준다.
function Row({ disabled, active, children }: { disabled?: boolean; active?: boolean; children?: ReactNode }) {
  const isActive = useIsActive() || active === true
  const drag = useReorderableDrag()
  const startDrag = () => {
    impactAsync(ImpactFeedbackStyle.Medium).catch(() => {})
    drag()
  }

  return (
    <DragContext.Provider value={disabled === true ? null : startDrag}>
      <Box
        sx={{
          borderLeftWidth: isActive ? 2 : 0,
          borderRightWidth: isActive ? 2 : 0,
          paddingHorizontal: isActive ? 2 : 0,
          borderColor: palette.primary,
        }}
      >
        {children}
      </Box>
    </DragContext.Provider>
  )
}

// 웹에서는 SortableList.Item 이 각 항목을 감쌌다.
// 이 구현은 셀이 그 단위라 자리만 유지한다.
function Item({ children }: { id?: string; children?: ReactNode }) {
  return <>{children}</>
}

SortableList.Item = Item

export const SortableItem = {
  Handle: Handle,
}

// 누르는 즉시(onPressIn) 끌면 안 된다. 라이브러리의 pan 은 state 가 IDLE 일 때만
// 시작 좌표를 잡는데, 그 전에 들어올리면 이 조건이 깨져 해제되지 않는다.
function Handle({ children, sx, id: _id }: Omit<BoxProps, 'id'> & { id: string | number }) {
  const drag = useContext(DragContext)

  if (drag == null) return <Box sx={{ alignItems: 'center', ...(sx ?? {}) }}>{children}</Box>

  return (
    <Pressable
      onLongPress={drag}
      delayLongPress={HANDLE_DRAG_ACTIVATION_DELAY_MS}
      hitSlop={8}
    >
      <Box sx={{ justifyContent: 'center', alignItems: 'center', ...(sx ?? {}) }}>{children}</Box>
    </Pressable>
  )
}
