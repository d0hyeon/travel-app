import GorhomBottomSheet, {
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, type ReactNode, type Ref } from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Box, Stack, Typography, sxToStyle, type BoxProps, type StackProps, type Sx } from '../mui'
import { palette } from '../../config/tokens'

// 웹 shared/components/bottom-sheet 와 같은 공개 인터페이스를 유지한다.
// 드래그·스냅은 @gorhom/bottom-sheet 가 처리한다.
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
  sx?: Sx
  ref?: Ref<BottomSheetRef>
}

export function BottomSheet(props: BottomSheetProps) {
  // 오버레이로 띄우는 경우 모달을 쓴다. 자체 포털·백드롭·높이 계산을 갖고 있어
  // 인라인 시트로는 대체되지 않는다.
  return props.isOpen != null ? <ModalSheet {...props} /> : <InlineSheet {...props} />
}

// 웹은 0-1 비율을 쓴다. 퍼센트 문자열은 부모 높이를 기준으로 하는데
// 오버레이 층(absoluteFill) 안에서는 그 기준이 잡히지 않아 시트가 눕는다.
// 화면 높이로 실제 픽셀을 계산해 넘긴다.
function useSnapHeights(snapPoints: BottomSheetProps['snapPoints']) {
  const { height } = useWindowDimensions()

  return useMemo(
    () => (snapPoints ?? [0.5]).map((ratio) => Math.round(height * ratio)),
    [snapPoints, height],
  )
}

function ModalSheet({
  children,
  snapPoints,
  defaultSnapIndex = 0,
  isOpen,
  onClose,
  onSnapChange,
  sx,
}: BottomSheetProps) {
  const sheetRef = useRef<GorhomBottomSheet>(null)
  const snapHeights = useSnapHeights(snapPoints)

  // BottomSheetModal 은 자체 포털에 그리는데, 오버레이 층 안에서는 그 포털이
  // 화면에 닿지 않는다. 오버레이 층이 이미 전체 화면이므로 인라인 시트를
  // 그 위에 직접 띄우고 백드롭만 손수 깐다.
  if (isOpen !== true) return null

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <GorhomBottomSheet
        ref={sheetRef}
        index={defaultSnapIndex}
        snapPoints={snapHeights}
        enablePanDownToClose
        onClose={onClose}
        onChange={(index) => {
          if (index === -1) {
            onClose?.()
            return
          }
          const ratio = snapPoints?.[index]
          if (ratio != null) onSnapChange?.(ratio)
        }}
        backgroundStyle={[styles.background, sxToStyle(sx)]}
        handleIndicatorStyle={styles.handle}
      >
        {children}
      </GorhomBottomSheet>
    </View>
  )
}

function InlineSheet({
  children,
  snapPoints,
  defaultSnapIndex = 0,
  onSnapChange,
  sx,
  ref,
}: BottomSheetProps) {
  const sheetRef = useRef<GorhomBottomSheet>(null)
  const snapHeights = useSnapHeights(snapPoints)

  useImperativeHandle(ref as never, () => ({ snap: defaultSnapIndex }), [defaultSnapIndex])

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={defaultSnapIndex}
      snapPoints={snapHeights}
      onChange={(index) => {
        const ratio = snapPoints?.[index]
        if (ratio != null) onSnapChange?.(ratio)
      }}
      backgroundStyle={[styles.background, sxToStyle(sx)]}
      handleIndicatorStyle={styles.handle}
    >
      {children}
    </GorhomBottomSheet>
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
        {typeof children === 'string' ? (
          <Typography variant="h6">{children}</Typography>
        ) : (
          children
        )}
        {rightElement}
      </Stack>
  )
}

function Body({ children, sx, ...props }: BoxProps) {
  return (
    <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={sxToStyle(sx)}>
      <Box {...props}>{children}</Box>
    </BottomSheetScrollView>
  )
}

function Scrollable({ children, sx, ...props }: BoxProps) {
  return (
    <BottomSheetScrollView contentContainerStyle={sxToStyle(sx)}>
      <Box {...props}>{children}</Box>
    </BottomSheetScrollView>
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
  background: { backgroundColor: palette.background, borderRadius: 20 },
  handle: { backgroundColor: palette.divider, width: 40 },
})
