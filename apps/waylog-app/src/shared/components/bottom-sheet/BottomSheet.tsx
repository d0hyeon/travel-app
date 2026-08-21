import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { Keyboard, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { ScrollViewContainer } from 'react-native-reorderable-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box, Stack, Typography, sxToStyle, type BoxProps, type StackProps, type Sx } from '../mui'
import { palette } from '../../config/tokens'

// 웹 shared/components/bottom-sheet 와 같은 공개 인터페이스를 유지한다.
export type BottomSheetRef = {
  snap: number
}

interface BottomSheetProps {
  children: ReactNode
  /** 스냅 포인트 (0-1 비율, 바텀시트가 차지하는 비율) */
  snapPoints?: number[] | readonly number[]
  /** 초기 스냅 포인트 인덱스 */
  defaultSnapIndex?: number
  /** 모달 모드: 열림/닫힘 상태 */
  isOpen?: boolean
  /** 모달 모드: 닫기 콜백 */
  onClose?: () => void
  /** 스냅 변경 콜백 (바텀시트가 차지하는 비율 전달) */
  onSnapChange?: (snapRatio: number) => void
  backdrop?: boolean
  /** 시트 아래에 형제가 없어 화면 바닥에 닿을 때만 켠다 */
  safeArea?: boolean
  sx?: Sx
  ref?: Ref<BottomSheetRef>
}

const SPRING = { damping: 20, stiffness: 200, mass: 0.6 } as const

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
  onClose,
  onSnapChange,
  safeArea = false,
  sx,
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
  const heights = useMemo(
    () => (snapPoints ?? [0.5]).map((ratio) => Math.round(baseH * ratio)),
    [snapPoints, baseH],
  )


  const [snapIndex, setSnapIndex] = useState(defaultSnapIndex)
  const height = heights[snapIndex] ?? heights[0] ?? 0

  // 시트 높이를 하나의 값으로 다룬다. 끌리는 중에는 손을 따라가고,
  // 손을 떼면 같은 값이 스프링으로 스냅 높이까지 이어진다.
  // 높이와 오프셋을 나눠 두면 놓는 순간 높이만 즉시 튀어 끊겨 보인다.
  const sheetH = useSharedValue(isOpen == null ? height : 0)
  const startH = useSharedValue(0)

  useImperativeHandle(ref as never, () => ({ snap: snapIndex }), [snapIndex])

  // 닫으라는 지시가 와도 높이가 줄어드는 동안은 화면에 남아 있어야 한다.
  // 애니메이션이 끝난 시점에만 내려 그때 언마운트한다.
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (isOpen == null) {
      sheetH.set(withSpring(height, SPRING))
      return
    }

    if (isOpen) {
      sheetH.set(withSpring(height, SPRING))
      return
    }

    sheetH.set(
      withSpring(0, SPRING, (finished) => {
        if (finished === true) runOnJS(setClosed)(true)
      }),
    )
  }, [isOpen, height, sheetH])

  // 다시 열리면 닫힘 표시를 지운다. 렌더 중에 맞추면 effect 가 필요 없다.
  if (isOpen === true && closed) setClosed(false)

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
        onClose?.()
        return
      }

      // 같은 스냅이면 상태가 안 바뀌어 effect 가 돌지 않는다. 직접 붙인다.
      sheetH.set(withSpring(heights[nearest] ?? 0, SPRING))
      if (nearest !== snapIndex) snapTo(nearest)
    },
    [heights, snapIndex, snapTo, isOpen, onClose, sheetH],
  )

  // 핸들 바에서만 시트를 끈다. 본문 제스처는 스크롤이 갖고,
  // 목록 드래그와도 영역이 겹치지 않아 서로 다툴 일이 없다.
  const pan = Gesture.Pan()
    .onStart(() => {
      startH.set(sheetH.get())
    })
    .onUpdate((event) => {
      // 위로 끌면 커지고 아래로 끌면 작아진다.
      sheetH.set(startH.get() - event.translationY)
    })
    .onEnd(() => {
      runOnJS(settle)(sheetH.get())
    })

  // 키보드가 가린 만큼 시트를 밀어 올린다. 시트가 화면 아래에 붙어 있어
  // 그대로 두면 입력 필드가 키보드 뒤로 들어간다.
  // 다만 높이를 그대로 둔 채 올리기만 하면 상단이 화면 밖으로 넘치므로,
  // 올린 만큼 높이도 줄여 화면 안에 머물게 한다.
  // 키보드 높이는 최종값만 받아 우리가 직접 보간한다.
  // 네이티브가 중간 프레임을 주지 않아 그대로 쓰면 다 열린 뒤 한 번에 튄다.
  // 키보드와 완전히 동기되지는 않지만 움직임 자체는 자연스러워진다.
  const kbLift = useSharedValue(0)

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (event) => {
      kbLift.set(withTiming(event.endCoordinates.height, {
        duration: toLiftDuration(event.duration),
      }))
    })
    const hide = Keyboard.addListener('keyboardWillHide', (event) => {
      kbLift.set(withTiming(0, { duration: toLiftDuration(event.duration, true) }))
    })

    return () => {
      show.remove()
      hide.remove()
    }
  }, [kbLift])

  const sheetStyle = useAnimatedStyle(() => {
    // 시트는 화면 바닥에 붙어 있다. 키보드가 덮는 만큼 아래를 채워 시트를
    // 그 위로 올린다. 올리는 대신 채우는 쪽이라 시트 배경이 이어져
    // 키보드와의 사이가 구멍이 아니라 여백으로 읽힌다.
    const lift = kbLift.get()

    // 화면 밖으로는 나갈 수 없다. 100% 스냅이어도 상단 안전영역은 남긴다.
    const limit = baseH - lift
    const content = Math.min(sheetH.get(), limit)

    return {
      // RN 은 border-box 라 height 가 padding 을 포함한다.
      // 채우는 만큼 더해야 내용이 쓸 자리가 그대로 남는다.
      height: content + lift,
      paddingBottom: lift,
    }
  })

  const bodyStyle = useAnimatedStyle(() => ({
    flex: 1,
    // 하단 안전영역은 시트가 화면 바닥에 닿을 때만 필요하다.
    // 아래에 형제가 자리를 차지하면 그쪽이 이미 처리하므로 여기서 더하면
    // 시트와 그 형제 사이가 벌어진다.
    paddingBottom: kbLift.get() > 0 ? 0 : safeBottom,
  }))

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      onLayout={(e) => setHostH(Math.round(e.nativeEvent.layout.height))}
    >
      {isOpen === true && <Pressable style={styles.backdrop} onPress={onClose} />}

      <Animated.View style={[styles.sheet, sheetStyle, sxToStyle(sx)]}>
        <GestureDetector gesture={pan}>
          <View style={styles.handleArea} hitSlop={{ top: 8, bottom: 8, left: 24, right: 24 }}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>

        {/* 남은 자리를 본문이 모두 갖는다. 스크롤은 이 안에서 일어난다. */}
        <Animated.View style={bodyStyle}>{children}</Animated.View>
      </Animated.View>
    </View>
  )
}

function Header({ children, rightElement, sx, ...props }: StackProps & { rightElement?: ReactNode }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 2, py: 1, ...(sx ?? {}) }}
      {...props}
    >
      {/* 문자열을 그대로 받으면 RN 이 렌더하지 못한다. 제목은 감싸준다. */}
      {typeof children === 'string' ? <Typography variant="h6">{children}</Typography> : children}
      {rightElement}
    </Stack>
  )
}

function Body({ children, sx, ...props }: BoxProps) {
  // 순서 변경 목록이 이 스크롤에 얹힌다. 라이브러리가 주는 컨테이너를 써야
  // 중첩된 목록이 자리를 계산할 수 있다.
  return (
    <ScrollViewContainer style={{ flex: 1 }} contentContainerStyle={sxToStyle(sx)}>
      <Box {...props}>{children}</Box>
    </ScrollViewContainer>
  )
}

function Scrollable({ children, sx, ...props }: BoxProps) {
  return (
    <ScrollView contentContainerStyle={sxToStyle(sx)}>
      <Box {...props}>{children}</Box>
    </ScrollView>
  )
}

function BottomActions({ children, sx, ...props }: StackProps) {
  return (
    <Stack direction="row" gap={1} sx={{ px: 2, py: 1, ...(sx ?? {}) }} {...props}>
      {children}
    </Stack>
  )
}

BottomSheet.Header = Header
BottomSheet.Body = Body
BottomSheet.Scrollable = Scrollable
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
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  // 손가락으로 잡는 자리다. 선만큼만 잡히면 답답해서 넉넉히 준다.
  handleArea: { alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#d0d0d0' },
})
