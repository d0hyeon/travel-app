import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { Gesture, GestureDetector, type PanGesture } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useScrollOffset,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, Stack, Typography, type BoxProps, type StackProps } from '~/shared/components/design-system'
import { palette, zLayer } from '../../config/tokens'
import {
  clampSheetHeight,
  getSheetBodyHeight,
  getGestureOwner,
  getSheetTranslateY,
  hasGestureDirection,
} from './bottomSheetGesture'
import { usePreservedCallback } from '@waylog/react'

// 웹 shared/components/bottom-sheet 와 같은 공개 인터페이스를 유지한다.
export type BottomSheetRef = {
  snap: number
}

interface SheetDragContextValue {
  /** 이번 제스처를 시트가 가져갔는지. 켜지면 그 동안 스크롤을 멈춘다 */
  isSheetOwner: SharedValue<boolean | null>
  /** 본문 스크롤 위치. 최상단(0)일 때만 아래로 당기는 힘이 시트로 간다 */
  scrollY: SharedValue<number>
  /**
   * 시트 끌기 제스처를 새로 만든다.
   * 한 인스턴스를 여러 곳에 붙이면 나중에 붙은 쪽이 핸들러 태그를 가져가
   * 먼저 붙은 쪽이 조용히 죽는다. 붙이는 곳마다 자기 것을 만든다.
   */
  createPan: () => PanGesture
  /** 헤더·비스크롤 본문처럼 스크롤과 경합하지 않는 영역의 시트 끌기 */
  createDirectPan: () => PanGesture
  /** 키보드가 열려 있는 동안만 true. Body 가 이때만 스크롤 가능해진다 */
  isKeyboardVisible: boolean
}

const SheetDragContext = createContext<SheetDragContextValue | null>(null)

function useSheetDrag(): SheetDragContextValue {
  const context = useContext(SheetDragContext)
  if (context == null) {
    throw new Error('BottomSheet 의 하위에서만 사용할 수 있다')
  }
  return context
}

// GestureArea 는 자기를 감싼 본문의 제스처를 지목해 막는다.
// 그 인스턴스를 알아야 하므로 본문이 자기 것을 아래로 내려준다.
const BodyPanContext = createContext<PanGesture | null>(null)

interface BottomSheetProps {
  children: ReactNode
  /** 스냅 포인트 (0-1 비율, 바텀시트가 차지하는 비율) */
  snapPoints?: number[] | readonly number[]
  /** 초기 스냅 포인트 인덱스 */
  defaultSnapIndex?: number
  /** 모달 모드: 열림/닫힘 상태 */
  isOpen?: boolean
  /** 모달 모드: 닫기 요청 (배경 탭·아래로 끌어내림). 소비자가 isOpen 을 내린다 */
  onDismiss?: () => void
  /** 모달 모드: 닫기 모션이 끝난 시점 */
  onClose?: () => void
  /** 스냅 변경 콜백 (바텀시트가 차지하는 비율 전달) */
  onSnapChange?: (snapRatio: number) => void
  backdrop?: boolean
  /** 시트 아래에 형제가 없어 화면 바닥에 닿을 때만 켠다 */
  safeArea?: boolean
  style?: StyleProp<ViewStyle>
  ref?: Ref<BottomSheetRef>
}

const SPRING = { damping: 20, stiffness: 200, mass: 0.6 } as const
const HANDLE_AREA_HEIGHT = 32

// 키보드보다 빠르게 붙는다. 그대로 맞추면 굼떠 보인다.
// 내려갈 때는 시트가 먼저 자리를 비켜야 답답하지 않아 더 줄인다.
const LIFT_SPEED = 0.55
const DROP_SPEED = 0.45

function toLiftDuration(keyboardDuration: number, dropping = false): number {
  const base = keyboardDuration > 0 ? keyboardDuration : 250
  return base * (dropping ? DROP_SPEED : LIFT_SPEED)
}

export function BottomSheet({
  children,
  snapPoints,
  defaultSnapIndex = 0,
  isOpen,
  onDismiss,
  onClose,
  onSnapChange,
  backdrop = true,
  safeArea = false,
  style,
  ref,
}: BottomSheetProps) {
  const { height: screenH } = useWindowDimensions()

  // 시트는 화면이 아니라 자기가 놓인 자리(탭 화면)를 덮는다.
  // 화면 높이로 비율을 재면 탭바만큼 넘쳐 아래가 잘린다.
  const [hostH, setHostH] = useState(0)
  const baseH = hostH > 0 ? hostH : screenH
  const insets = useSafeAreaInsets()
  const safeBottom = safeArea ? insets.bottom : 0

  // 시트가 차지할 높이들. 큰 것부터 두면 인덱스와 높이가 함께 커진다.
  // 워크릿에서 최대 높이를 읽어야 한다. 이미 다 커졌으면 위로 끄는 힘은
  // 시트가 아니라 스크롤 몫이다.
  const maxH = useSharedValue(0)

  const heights = useMemo(
    () => (snapPoints ?? [0.5]).map((ratio) => Math.round(baseH * ratio)),
    [snapPoints, baseH],
  )


  const [snapIndex, setSnapIndex] = useState(defaultSnapIndex)
  const height = heights[snapIndex] ?? heights[0] ?? 0

  useEffect(() => {
    maxH.set(Math.max(...heights, 0))
  }, [heights, maxH])

  // 시트 높이를 하나의 값으로 다룬다. 끌리는 중에는 손을 따라가고,
  // 손을 떼면 같은 값이 스프링으로 스냅 높이까지 이어진다.
  // 높이와 오프셋을 나눠 두면 놓는 순간 높이만 즉시 튀어 끊겨 보인다.
  const sheetH = useSharedValue(isOpen == null ? height : 0)
  const startH = useSharedValue(0)

  useImperativeHandle(ref, () => ({ snap: snapIndex }), [snapIndex])

  // 닫으라는 지시가 와도 높이가 줄어드는 동안은 화면에 남아 있어야 한다.
  // 닫힘을 알리는 것은 애니메이션이 끝난 시점이다. 소비자는 그때
  // 뒷정리(폼 초기화·언마운트)를 해야 내려가는 도중에 내용이 사라지지 않는다.

  const notifyClosed = usePreservedCallback(() => onClose?.())

  // 닫힌 채로 시작한 시트는 닫힌 적이 없다. 열린 적이 있어야 닫힘을 알린다.
  const opened = useRef(false)
  if (isOpen === true) opened.current = true

  useEffect(() => {
    if (isOpen == null || isOpen) {
      sheetH.set(withSpring(height, SPRING))
      return
    }

    if (!opened.current) return

    sheetH.set(
      withSpring(0, SPRING, (finished) => {
        if (finished === true) runOnJS(notifyClosed)()
      }),
    )
  }, [isOpen, height, sheetH, notifyClosed])

  const snapTo = useCallback(
    (index: number) => {
      setSnapIndex(index)
      const ratio = snapPoints?.[index]
      if (ratio != null) onSnapChange?.(ratio)
    },
    [snapPoints, onSnapChange],
  )

  const settle = useCallback(
    (dragged: number) => {
      // 놓은 높이에 가장 가까운 스냅을 고른다.
      let nearest = 0
      for (let i = 1; i < heights.length; i += 1) {
        const candidate = heights[i] ?? 0
        const best = heights[nearest] ?? 0
        if (Math.abs(candidate - dragged) < Math.abs(best - dragged)) nearest = i
      }

      // 가장 낮은 스냅에서 더 끌어내리면 닫는다.
      if (isOpen != null && nearest === 0 && dragged < (heights[0] ?? 0) * 0.6) {
        onDismiss?.()
        return
      }

      // 같은 스냅이면 상태가 안 바뀌어 effect 가 돌지 않는다. 직접 붙인다.
      sheetH.set(withSpring(heights[nearest] ?? 0, SPRING))
      if (nearest !== snapIndex) snapTo(nearest)
    },
    [heights, snapIndex, snapTo, isOpen, onDismiss, sheetH],
  )

  // 본문 스크롤 위치. 스크롤이 없는 본문은 0 에서 움직이지 않아
  // 어느 방향으로 당겨도 시트가 따라온다.
  const scrollY = useSharedValue(0)

  const settleAtRest = usePreservedCallback(settle)

  // 직전 프레임의 누적 이동량. 프레임별 변화량을 내기 위해 들고 있는다.
  const lastY = useSharedValue(0)
  const touchStartY = useSharedValue(0)
  const touchStartX = useSharedValue(0)

  // 이번 제스처를 시트가 가져갈지, 스크롤에 넘길지. 첫 움직임에 한 번 정한다.
  // null 은 아직 정하지 않았다는 뜻이다.
  const isSheetOwner = useSharedValue<boolean | null>(null)

  // 손이 닿은 순간 스크롤이 최상단이었는지. 활성화 전에 재둬야 한다.
  const wasAtTop = useSharedValue(true)

  // 핸들 바 전용. 스크롤과 경합할 일이 없어 양보 판정 없이 바로 끈다.
  const createDirectPan = useCallback(
    () =>
      Gesture.Pan()
        .onStart(() => {
          startH.set(sheetH.get())
        })
        .onUpdate((event) => {
          sheetH.set(startH.get() - event.translationY)
        })
        .onEnd(() => {
          runOnJS(settleAtRest)(sheetH.get())
        }),
    [startH, sheetH, settleAtRest],
  )
  const handlePan = useMemo(() => createDirectPan(), [createDirectPan])

  // 본문용. 규칙은 두 줄이다.
  //  - 아래로: 스크롤이 최상단이면 시트를 내리고, 아니면 스크롤에 맡긴다.
  //  - 위로: 언제나 스크롤에 맡긴다.
  //
  // 주인 판정은 제스처가 시작될 때 한 번만 한다.
  // 끄는 도중 매 프레임 scrollY 를 다시 보면, 시트가 내려가는 동안 스크롤이
  // 바운스로 흔들릴 때마다 주인이 뒤바뀌어 됐다 안 됐다 한다.
  //
  // 방향은 누적(translationY)이 아니라 프레임별 변화량으로 본다.
  // 누적은 방향을 바꿔도 부호가 그대로라 되돌리는 순간을 놓친다.
  const createPan = useCallback(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        // 손이 닿는 순간의 스크롤 위치를 잡아둔다.
        // onStart 는 활성화(6px) 이후라 그 사이 스크롤이 이미 움직여
        // scrollY 가 0 을 벗어난다. 최상단이었는지는 여기서만 알 수 있다.
        .onTouchesDown((event) => {
          const touch = event.changedTouches[0]
          if (touch == null) return

          wasAtTop.set(scrollY.get() <= 0)
          touchStartY.set(touch.absoluteY)
          touchStartX.set(touch.absoluteX)
        })
        .onTouchesMove((event, manager) => {
          const touch = event.changedTouches[0]
          if (touch == null) return

          const translationY = touch.absoluteY - touchStartY.get()
          const translationX = touch.absoluteX - touchStartX.get()
          if (!hasGestureDirection(translationY, translationX)) return

          if (getGestureOwner({ startedAtTop: wasAtTop.get(), deltaY: translationY }) === 'sheet') {
            manager.activate()
            return
          }

          manager.fail()
        })
        .onStart(() => {
          lastY.set(0)
          isSheetOwner.set(true)
        })
        .onUpdate((event) => {
          const deltaY = event.translationY - lastY.get()
          lastY.set(event.translationY)
          if (deltaY === 0) return

          // 위로 끄는 힘은 시트가 갖지 않는다.
          // 내려간 시트를 다시 올리는 것은 여기서 허용한다 — 같은 제스처 안에서
          // 방향만 되돌리는 것이라, 스크롤은 아직 최상단 그대로다.
          const next = sheetH.get() - deltaY
          sheetH.set(clampSheetHeight(next, maxH.get()))
        })
        .onEnd(() => {
          if (isSheetOwner.get() !== true) return
          runOnJS(settleAtRest)(sheetH.get())
        })
        .onFinalize(() => {
          isSheetOwner.set(null)
        }),
    [scrollY, sheetH, maxH, lastY, isSheetOwner, wasAtTop, touchStartY, settleAtRest],
  )

  // 키보드가 가린 만큼 시트를 밀어 올린다. 시트가 화면 아래에 붙어 있어
  // 그대로 두면 입력 필드가 키보드 뒤로 들어간다.
  // 다만 높이를 그대로 둔 채 올리기만 하면 상단이 화면 밖으로 넘치므로,
  // 올린 만큼 높이도 줄여 화면 안에 머물게 한다.
  // 키보드 높이는 최종값만 받아 우리가 직접 보간한다.
  // 네이티브가 중간 프레임을 주지 않아 그대로 쓰면 다 열린 뒤 한 번에 튄다.
  // 키보드와 완전히 동기되지는 않지만 움직임 자체는 자연스러워진다.
  const kbLift = useSharedValue(0)

  // Will* 이벤트는 iOS 전용이라 애니메이션 타이밍(kbLift)에만 쓴다.
  // 본문 스크롤 전환은 플랫폼 공통인 Did* 로 별도로 잡는다.
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (event) => {
      kbLift.set(withTiming(event.endCoordinates.height, {
        duration: toLiftDuration(event.duration),
      }))
    })
    const hide = Keyboard.addListener('keyboardWillHide', (event) => {
      kbLift.set(withTiming(0, { duration: toLiftDuration(event.duration, true) }))
    })
    const didShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
    const didHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))

    return () => {
      show.remove()
      hide.remove()
      didShow.remove()
      didHide.remove()
    }
  }, [kbLift])

  const sheetStyle = useAnimatedStyle(() => {
    // 시트는 화면 바닥에 붙어 있다. 키보드가 덮는 만큼 아래를 채워 시트를
    // 그 위로 올린다. 올리는 대신 채우는 쪽이라 시트 배경이 이어져
    // 키보드와의 사이가 구멍이 아니라 여백으로 읽힌다.
    const lift = kbLift.get()

    // 화면 밖으로는 나갈 수 없다. 100% 스냅이어도, 키보드가 밀어 올려도
    // 상단 안전영역(다이나믹 아일랜드 등)은 항상 남긴다.
    const limit = baseH - lift - insets.top
    const visibleHeight = Math.min(sheetH.get(), limit)
    const expandedHeight = Math.min(maxH.get() || visibleHeight, limit)

    return {
      // 항상 가장 큰 스냅 높이로 레이아웃을 잡고, 작은 스냅은 시트 전체를
      // 아래로 보낸다. 그래서 BottomActions도 화면 바닥에 고정되지 않고
      // 헤더·본문과 함께 움직인다.
      height: expandedHeight + lift,
      paddingBottom: lift,
      transform: [{ translateY: getSheetTranslateY({ visibleHeight, maximumHeight: expandedHeight }) }],
    }
  })

  const dragContext = useMemo(
    () => ({ scrollY, createPan, createDirectPan, isSheetOwner, isKeyboardVisible }),
    [scrollY, createPan, createDirectPan, isSheetOwner, isKeyboardVisible],
  )

  const bodyStyle = useAnimatedStyle(() => {
    const lift = kbLift.get()
    const visibleHeight = Math.min(sheetH.get(), baseH - lift - insets.top)

    return {
      // 시트 전체는 최대 높이로 렌더링하지만 본문 뷰포트는 현재 보이는
      // 높이만 쓴다. 그래야 스크롤 끝의 콘텐츠가 화면 밖에 남지 않는다.
      height: getSheetBodyHeight({ visibleHeight, handleHeight: HANDLE_AREA_HEIGHT }),
      flexGrow: 0,
      flexShrink: 0,
      // 하단 안전영역은 시트가 화면 바닥에 닿을 때만 필요하다.
      // 아래에 형제가 자리를 차지하면 그쪽이 이미 처리하므로 여기서 더하면
      // 시트와 그 형제 사이가 벌어진다.
      paddingBottom: lift > 0 ? 0 : safeBottom,
    }
  })

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: zLayer.bottomSheet }]}
      pointerEvents="box-none"
      onLayout={(e) => setHostH(Math.round(e.nativeEvent.layout.height))}
    >
      {isOpen === true && backdrop && <Pressable style={styles.backdrop} onPress={onDismiss} />}

      <Animated.View style={[styles.sheet, sheetStyle, style]}>
        <SheetDragContext.Provider value={dragContext}>
          <GestureDetector gesture={handlePan}>
            <View style={styles.handleArea} hitSlop={{ top: 8, bottom: 8, left: 24, right: 24 }}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>

          {/* 남은 자리를 본문이 모두 갖는다. 스크롤은 이 안에서 일어난다. */}
          <Animated.View style={bodyStyle}>
            {children}
          </Animated.View>
        </SheetDragContext.Provider>
      </Animated.View>
    </View>
  )
}

function Header({ children, rightElement, style, ...props }: StackProps & { rightElement?: ReactNode }) {
  const { createDirectPan } = useSheetDrag()
  const pan = useMemo(() => createDirectPan(), [createDirectPan])

  return (
    <GestureDetector gesture={pan}>
      <View>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          style={[{ paddingHorizontal: 16, paddingVertical: 8 }, style]}
          {...props}
        >
          {/* 문자열을 그대로 받으면 RN 이 렌더하지 못한다. 제목은 감싸준다. */}
          {typeof children === 'string' ? <Typography variant="h6">{children}</Typography> : children}
          {rightElement}
        </Stack>
      </View>
    </GestureDetector>
  )
}

function Body({ children, style, ...props }: BoxProps) {
  const { createDirectPan } = useSheetDrag()
  const pan = useMemo(() => createDirectPan(), [createDirectPan])

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1 }}>
        <BodyPanContext.Provider value={pan}>
          <Box style={[{ flex: 1 }, style]} {...props}>{children}</Box>
        </BodyPanContext.Provider>
      </View>
    </GestureDetector>
  )
}

/**
 * 입력 필드만 있는 단순 폼 전용. 지도·정렬 목록처럼 `GestureArea` 를 쓰는
 * 시트는 이 컴포넌트를 쓰지 않는다 — 스크롤 전환이 그 flex 레이아웃을 깬다.
 *
 * 평소엔 `Body` 처럼 보이지만, `View` 대신 `scrollEnabled={false}` 인
 * `SheetScrollView` 다. 키보드가 열려 있을 때만 스크롤을 켜고 포커스된
 * 필드로 자동 스크롤한다. `View`/`ScrollView` 를 조건부로 바꿔치기하면 그
 * 아래 `TextInput` 까지 통째로 리마운트돼 포커스가 끊기고 키보드가 닫힌다 —
 * 그래서 컴포넌트 종류는 항상 같게 두고 `scrollEnabled` 만 바꾼다.
 *
 * 시트 드래그 결합은 `SheetScrollView` 와 같은 방식(`Gesture.Native` +
 * `Simultaneous`)을 쓴다. `GestureDetector` 에 `pan` 만 걸면 네이티브 스크롤
 * responder 를 가진 자식을 gesture-handler 가 우선해 드래그가 씹힌다.
 */
function KeyboardAwareBody({ children, style, width, height, flex, minWidth, position, textAlign, ...props }: BoxProps) {
  const { scrollY, createPan, isKeyboardVisible } = useSheetDrag()
  const scrollRef = useAnimatedRef<Animated.ScrollView>()

  useScrollOffset(scrollRef, scrollY)

  const nativeScroll = useMemo(() => Gesture.Native(), [])
  const pan = useMemo(() => createPan(), [createPan])
  const scrollAndPan = useMemo(() => Gesture.Simultaneous(nativeScroll, pan), [nativeScroll, pan])

  // 포커스가 옮겨가는 순간(키보드가 이미 떠 있는 채로 다음 필드로 넘어갈 때도
  // 포함)마다 그 필드가 키보드 위로 오도록 스크롤한다.
  // Did* 이벤트라 포커스가 먼저 잡힌 뒤 온다 — currentlyFocusedInput 이 그
  // 시점에 최신 값이다. currentlyFocusedField(노드 핸들 반환)는 deprecated 라
  // 인스턴스를 반환하는 쪽을 쓴다 — scrollResponderScrollNativeHandleToKeyboard
  // 는 nodeHandle 과 인스턴스를 모두 받는다.
  useEffect(() => {
    if (!isKeyboardVisible) return

    const focused = TextInput.State.currentlyFocusedInput()
    if (focused == null) return

    scrollRef.current?.getScrollResponder()?.scrollResponderScrollNativeHandleToKeyboard(focused, 16, true)
  }, [isKeyboardVisible, scrollRef])

  // Box 가 하던 축약 prop → 스타일 변환을 그대로 재현한다.
  // 스크롤 콘텐츠 컨테이너라 style 은 contentContainerStyle 로 가야
  // padding 등이 콘텐츠에 붙는다 (평소엔 스크롤이 꺼져 있어도 동일하게 적용).
  const contentStyle = [
    { width, height, flex, minWidth, position, alignItems: textAlign === 'center' ? 'center' : undefined } as ViewStyle,
    style,
  ]

  return (
    <GestureDetector gesture={scrollAndPan}>
      <BodyPanContext.Provider value={pan}>
        <Animated.ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          scrollEnabled={isKeyboardVisible}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={contentStyle}
          {...props}
        >
          {children}
        </Animated.ScrollView>
      </BodyPanContext.Provider>
    </GestureDetector>
  )
}

/**
 * 시트 안에서 쓰는 `ScrollView`.
 *
 * 시트 안의 스크롤은 가로·세로 구분 없이 전부 이것을 쓴다.
 * 맨 `ScrollView` 를 쓰면 그 자식이 터치를 독점해 시트 판정까지 오지 않는다.
 * 자식 스크롤은 자기 네이티브 핸들러를 갖는데, 시트 제스처와 아무 관계도
 * 맺혀 있지 않으면 gesture-handler 는 자식을 우선하기 때문이다.
 *
 * 세로 스크롤은 자기 위치를 시트에 알려, 최상단에서 아래로 당기면
 * 스크롤 대신 시트가 끌린다. 가로 스크롤은 위치를 알리지 않는다 —
 * 시트가 보는 것은 세로 위치뿐이라 가로 값을 쓰면 판정이 어긋난다.
 */
function SheetScrollView({
  children,
  horizontal,
  ref,
  style,
  ...props
}: ScrollViewProps & { ref?: Ref<Animated.ScrollView> }) {
  const { scrollY, createPan, isSheetOwner } = useSheetDrag()
  const parentPan = useContext(BodyPanContext)
  const scrollRef = useAnimatedRef<Animated.ScrollView>()

  // 위치 추적에는 내부 ref 가 필요하고, 소비자는 scrollTo 를 위해 자기 ref 를
  // 원한다. 둘 다 같은 인스턴스를 가리키게 이어준다.
  useImperativeHandle(ref, () => scrollRef.current as Animated.ScrollView, [scrollRef])

  // 시트가 보는 스크롤 위치는 하나뿐이다. 바깥에 이미 스크롤이 있으면
  // 그쪽이 주인이고, 여기서 또 쓰면 서로 덮어써 판정이 뒤집힌다.
  // 가로도 마찬가지로 시트 판정에 쓰이면 안 된다.
  const ownOffset = useSharedValue(0)
  const isOwner = horizontal !== true
  useScrollOffset(scrollRef, isOwner ? scrollY : ownOffset)


  // 이 스크롤을 시트 제스처와 엮는다. 묶지 않으면 자식인 이쪽이 이겨 시트
  // 제스처가 시작조차 못 한다.
  // 다만 바깥에 이미 시트 제스처가 걸린 스크롤이 있으면 여기서 또 걸지 않는다.
  // 같은 터치에 같은 판정이 두 번 돌아 시트 높이가 두 배로 움직인다.
  const nativeScroll = useMemo(() => Gesture.Native(), [])
  const pan = useMemo(() => createPan(), [createPan])
  const scrollAndPan = useMemo(() => {
    if (parentPan != null) {
      nativeScroll.blocksExternalGesture(parentPan)
    }
    return Gesture.Simultaneous(nativeScroll, pan)
  }, [nativeScroll, pan, parentPan])

  // 시트가 끄는 동안만 멈춘다. UI 스레드에서 바로 반영된다.
  const scrollProps = useAnimatedProps(() => ({
    scrollEnabled: isSheetOwner.get() !== true,
  }))

  return (
    <GestureDetector gesture={scrollAndPan}>
      <BodyPanContext.Provider value={pan}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal={horizontal}
          style={[{ flex: 1 }, style]}
          animatedProps={scrollProps}
          {...props}
        >
          {children}
        </Animated.ScrollView>
      </BodyPanContext.Provider>
    </GestureDetector>
  )
}

/**
 * 자기 제스처를 갖는 영역. 이 안에서는 시트가 끌리지 않는다.
 * 순서 변경 목록·지도처럼 터치를 독점해야 하는 것을 감싼다.
 */
function GestureArea({ children, style, ...props }: BoxProps) {
  const bodyPan = useContext(BodyPanContext)

  // 이 영역의 제스처가 본문의 시트 제스처를 이긴다. 시트 전체를 끄는 것과 달리
  // 바깥 영역에서는 시트가 그대로 끌린다.
  const block = useMemo(
    () => (bodyPan == null ? Gesture.Native() : Gesture.Native().blocksExternalGesture(bodyPan)),
    [bodyPan],
  )

  // GestureDetector 는 자식의 ref 로 붙는다. Box 는 forwardRef 가 아니라
  // ref 가 spread 순서에 얹혀 가므로, 여기서는 View 를 직접 두고 children 을
  // 바로 담는다 — 레이어를 하나만 둬야 그 사이에서 flex 상속이 끊기지 않는다.
  // flex: 1 은 기본값일 뿐이다. 부모 크기를 그대로 채워 레이아웃에 개입하지
  // 않는 것이 기본 동작이고, style 로 주면 그대로 덮어써 원하는 크기를 준다.
  return (
    <GestureDetector gesture={block}>
      <View style={[{ flex: 1 }, style]} {...props}>
        {children}
      </View>
    </GestureDetector>
  )
}

function BottomActions({ children, style, ...props }: StackProps) {
  return (
    <Stack
      direction="row"
      gap={1}
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: palette.background,
          zIndex: zLayer.bottomSheet,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Stack>
  )
}

BottomSheet.Header = Header
BottomSheet.Body = Body
BottomSheet.KeyboardAwareBody = KeyboardAwareBody
BottomSheet.ScrollView = SheetScrollView
BottomSheet.GestureArea = GestureArea
BottomSheet.BottomActions = BottomActions

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -5 },
    elevation: 8,
  },
  // 손가락으로 잡는 자리다. 선만큼만 잡히면 답답해서 넉넉히 준다.
  handleArea: { alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#d0d0d0' },
})
