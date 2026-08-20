import { createContext, useContext, useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { LayoutAnimation, View, type LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
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

interface DragContextValue {
  /** 항목이 자기 인덱스와 높이를 등록한다. 드롭 위치 계산에 쓰인다. */
  register: (index: number, height: number) => void
  onDrop: (from: number, offsetY: number) => void
  activeIndex: number | null
  setActiveIndex: (index: number | null) => void
}

const DragContext = createContext<DragContextValue | null>(null)
const IndexContext = createContext(0)
// 바텀시트가 이 제스처에 길을 내주기 위해 참조한다.
export const dragGestureRef: MutableRefObject<GestureType | undefined> = { current: undefined }

// 끌리는 행의 이동량. 핸들이 쓰고 행이 그린다.
const TranslateContext = createContext<ReturnType<typeof useSharedValue<number>> | null>(null)

export function SortableList<T extends { id: string }>({
  items: _items,
  onSort,
  renderItem,
  disabled,
}: Props<T>) {
  const [items, setItems] = useState(_items)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const heights = useRef<number[]>([])

  useEffect(() => {
    setItems(_items)
  }, [_items])

  const move = (from: number, to: number) => {
    if (to === from || to < 0 || to >= items.length) return

    const next = [...items]
    const [moved] = next.splice(from, 1)
    if (moved == null) return
    next.splice(to, 0, moved)

    // 손을 뗀 뒤 새 자리로 미끄러지듯 정렬된다.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setItems(next)
    onSort?.({ from, to, items: next })
  }

  // 끌어온 거리를 항목 높이로 나눠 몇 칸 이동했는지 구한다.
  const onDrop = (from: number, offsetY: number) => {
    const rowHeight = heights.current[from] ?? 0
    if (rowHeight === 0) return

    move(from, from + Math.round(offsetY / rowHeight))
  }

  const context: DragContextValue = {
    register: (index, height) => {
      heights.current[index] = height
    },
    onDrop,
    activeIndex,
    setActiveIndex,
  }

  return (
    <DragContext.Provider value={disabled === true ? null : context}>
      {items.map((item, index) => (
        <IndexContext.Provider key={item.id} value={index}>
          <SortableRow index={index}>{renderItem?.(item, index)}</SortableRow>
        </IndexContext.Provider>
      ))}
    </DragContext.Provider>
  )
}

// 끌리는 동안 해당 행만 손가락을 따라 움직이고 다른 행 위에 겹쳐 보인다.
function SortableRow({ index, children }: { index: number; children?: ReactNode }) {
  const drag = useContext(DragContext)
  const translateY = useSharedValue(0)
  const isActive = drag?.activeIndex === index

  useEffect(() => {
    if (!isActive) translateY.value = 0
  }, [isActive, translateY])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isActive ? 1 : 0,
    opacity: isActive ? 0.9 : 1,
  }))

  const onLayout = (event: LayoutChangeEvent) => {
    drag?.register(index, event.nativeEvent.layout.height)
  }

  return (
    <TranslateContext.Provider value={translateY}>
      <Animated.View style={style} onLayout={onLayout}>
        {children}
      </Animated.View>
    </TranslateContext.Provider>
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

// 웹과 같이 이 자리를 잡아야만 끌리고, children 으로 받은 아이콘을 그대로 쓴다.
function Handle({ children, sx, id: _id }: Omit<BoxProps, 'id'> & { id: string | number }) {
  const drag = useContext(DragContext)
  const index = useContext(IndexContext)
  const translateY = useContext(TranslateContext)

  if (drag == null || translateY == null) return <Box sx={sx}>{children}</Box>

  // 핸들에서 시작한 세로 끌기만 가로챈다.
  // 시트는 이 제스처가 실패할 때까지 기다린다(BottomSheet 의 waitFor).
  const pan = Gesture.Pan()
    .withRef(dragGestureRef)
    .activeOffsetY([-8, 8])
    .onStart(() => {
      runOnJS(drag.setActiveIndex)(index)
    })
    .onUpdate((event) => {
      translateY.value = event.translationY
    })
    .onEnd((event) => {
      runOnJS(drag.onDrop)(index, event.translationY)
    })
    .onFinalize(() => {
      runOnJS(drag.setActiveIndex)(null)
    })

  return (
    <GestureDetector gesture={pan}>
      <View>
        <Box sx={{ justifyContent: 'center', ...(sx ?? {}) }}>{children}</Box>
      </View>
    </GestureDetector>
  )
}
