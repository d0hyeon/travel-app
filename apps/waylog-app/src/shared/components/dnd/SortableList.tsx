import { MaterialIcons } from '@expo/vector-icons'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Pressable } from 'react-native'
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

interface MoveHandlers {
  moveUp: () => void
  moveDown: () => void
}

const MoveContext = createContext<MoveHandlers | null>(null)

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

  // 바텀시트·스크롤뷰 안에 놓이므로 가상 목록을 쓰지 않는다.
  // 핸들을 길게 누르면 위아래로 옮긴다.
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return

    const next = [...items]
    const [moved] = next.splice(from, 1)
    if (moved == null) return
    next.splice(to, 0, moved)

    setItems(next)
    onSort?.({ from, to, items: next })
  }

  return (
    <>
      {items.map((item, index) => (
        <MoveContext.Provider
          key={item.id}
          value={
            disabled === true
              ? null
              : {
                  moveUp: () => move(index, index - 1),
                  moveDown: () => move(index, index + 1),
                }
          }
        >
          {renderItem?.(item, index)}
        </MoveContext.Provider>
      ))}
    </>
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

// 웹은 드래그 핸들이지만 RN 스크롤 안에서는 제스처가 충돌한다.
// 같은 자리에서 순서를 바꾸도록 위/아래 버튼을 둔다.
function Handle({ sx, id: _id }: Omit<BoxProps, 'id'> & { id: string | number }) {
  const move = useContext(MoveContext)
  if (move == null) return null

  return (
    <Box sx={{ justifyContent: 'center', ...(sx ?? {}) }}>
      <Pressable onPress={move.moveUp} hitSlop={6}>
        <MaterialIcons name="keyboard-arrow-up" size={20} color="#787c7e" />
      </Pressable>
      <Pressable onPress={move.moveDown} hitSlop={6}>
        <MaterialIcons name="keyboard-arrow-down" size={20} color="#787c7e" />
      </Pressable>
    </Box>
  )
}
