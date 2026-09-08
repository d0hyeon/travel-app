import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Pressable, type FlatList } from 'react-native'
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

  return (
    <DragContext.Provider value={disabled === true ? null : drag}>
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

// 웹과 같이 이 자리를 잡아야만 끌리고, children 으로 받은 아이콘을 그대로 쓴다.
function Handle({ children, sx, id: _id }: Omit<BoxProps, 'id'> & { id: string | number }) {
  const drag = useContext(DragContext)

  if (drag == null) return <Box sx={{ alignItems: 'center', ...(sx ?? {}) }}>{children}</Box>

  return (
    <Pressable
      onLongPress={() => {
        void impactAsync(ImpactFeedbackStyle.Medium)
        drag()
      }}
      delayLongPress={500}
      hitSlop={8}
    >
      <Box sx={{ justifyContent: 'center', alignItems: 'center', ...(sx ?? {}) }}>{children}</Box>
    </Pressable>
  )
}
