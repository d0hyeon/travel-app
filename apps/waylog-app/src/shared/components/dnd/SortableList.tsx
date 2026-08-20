import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist'
import { Box, type BoxProps } from '../mui'

// 웹 dnd/SortableList 와 같은 공개 인터페이스를 유지한다.
// 내부는 @dnd-kit(DOM) 대신 gesture-handler 기반 구현을 쓴다.
export type SortEvent<T> = { from: number; to: number; items: T[] }

type Props<T extends { id: string }> = {
  items: T[]
  onSort?: (event: SortEvent<T>) => void
  renderItem?: (item: T, index: number) => ReactNode
  disabled?: boolean
  children?: ReactNode
}

const DragContext = createContext<(() => void) | null>(null)

export function SortableList<T extends { id: string }>({
  items: _items,
  onSort,
  renderItem,
  disabled,
}: Props<T>) {
  const [items, setItems] = useState(_items)

  useEffect(() => {
    setItems(_items)
  }, [_items])

  return (
    <DraggableFlatList
      data={items}
      keyExtractor={(item) => item.id}
      activationDistance={disabled ? Number.MAX_SAFE_INTEGER : 12}
      onDragEnd={({ data, from, to }) => {
        setItems(data)
        if (from !== to) onSort?.({ from, to, items: data })
      }}
      renderItem={({ item, getIndex, drag }) => (
        <ScaleDecorator>
          <DragContext.Provider value={drag}>
            {renderItem?.(item, getIndex() ?? 0)}
          </DragContext.Provider>
        </ScaleDecorator>
      )}
    />
  )
}

// 웹에서는 SortableList.Item 이 각 항목을 감쌌다. RN 은 renderItem 이 그 역할을
// 하므로 자리만 유지한다.
function Item({ children }: { id: string; children?: ReactNode }) {
  return <>{children}</>
}

SortableList.Item = Item

export const SortableItem = {
  Handle: Handle,
}

// 이 핸들을 길게 누르면 드래그가 시작된다.
function Handle({ children, sx, id: _id, ...props }: Omit<BoxProps, 'id'> & { id: string | number }) {
  const drag = useContext(DragContext)

  return (
    <Box onTouchStart={() => drag?.()} sx={sx} {...props}>
      {children}
    </Box>
  )
}
