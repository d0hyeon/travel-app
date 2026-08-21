import { createContext, useContext, useState, type ReactNode } from 'react'
import { Pressable } from 'react-native'
import {
  NestedReorderableList,
  reorderItems,
  useReorderableDrag,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list'
import { Box, type BoxProps } from '../mui'

// 웹 dnd/SortableList 와 같은 공개 인터페이스를 유지한다.
// 내부는 @dnd-kit(DOM) 대신 react-native-reorderable-list 를 쓴다.
export type SortEvent<T> = { from: number; to: number; items: T[] }

type Props<T extends { id: string }> = {
  items: T[]
  onSort?: (event: SortEvent<T>) => void
  renderItem?: (item: T, index: number) => ReactNode
  disabled?: boolean
  children?: ReactNode
}

// 핸들이 자기 행을 끌 수 있게 드래그 시작 함수를 내려준다.
const DragContext = createContext<(() => void) | null>(null)

export function SortableList<T extends { id: string }>({
  items: _items,
  onSort,
  renderItem,
  disabled,
}: Props<T>) {
  const [items, setItems] = useState(_items);
  const handleReorder = ({ from, to }: ReorderableListReorderEvent) => {
    const next = reorderItems(items, from, to)
    setItems(next);
    onSort?.({ from, to, items: next })
  }

  return (
    <NestedReorderableList
      data={items}
      keyExtractor={(item) => item.id}
      // 바텀시트의 스크롤을 그대로 쓴다. 목록이 따로 스크롤하지 않는다.
      scrollable={false}
      onReorder={handleReorder}
      renderItem={({ item, index }) => (
        <Row disabled={disabled}>{renderItem?.(item, index)}</Row>
      )}
    />
  )
}

// 셀 하나가 드래그 단위다. 여기서 얻은 시작 함수를 핸들에 내려준다.
function Row({ disabled, children }: { disabled?: boolean; children?: ReactNode }) {
  const drag = useReorderableDrag()

  return (
    <DragContext.Provider value={disabled === true ? null : drag}>
      {children}
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

  if (drag == null) return <Box sx={sx}>{children}</Box>

  return (
    <Pressable onLongPress={drag} delayLongPress={150} hitSlop={8}>
      <Box sx={{ justifyContent: 'center', ...(sx ?? {}) }}>{children}</Box>
    </Pressable>
  )
}
