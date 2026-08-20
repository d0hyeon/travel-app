import GorhomBottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetProps as GorhomProps,
} from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, type ReactNode, type Ref } from 'react'
import { StyleSheet } from 'react-native'
import { Box, Stack, sxToStyle, type BoxProps, type StackProps, type Sx } from '../mui'
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

export function BottomSheet({
  children,
  snapPoints = [0.5],
  defaultSnapIndex = 0,
  isOpen,
  onClose,
  onSnapChange,
  sx,
  ref,
}: BottomSheetProps) {
  const sheetRef = useRef<GorhomBottomSheet>(null)

  // 웹은 0-1 비율을 쓴다. gorhom 은 '50%' 형태를 받는다.
  const percentPoints = useMemo(
    () => snapPoints.map((ratio) => `${Math.round(ratio * 100)}%`),
    [snapPoints],
  )

  useImperativeHandle(ref as never, () => ({ snap: defaultSnapIndex }), [defaultSnapIndex])

  // 모달 모드에서만 isOpen 이 넘어온다.
  useEffect(() => {
    if (isOpen == null) return
    if (isOpen) sheetRef.current?.snapToIndex(defaultSnapIndex)
    else sheetRef.current?.close()
  }, [isOpen, defaultSnapIndex])

  const handleChange = useCallback<NonNullable<GorhomProps['onChange']>>(
    (index) => {
      if (index === -1) {
        onClose?.()
        return
      }
      const ratio = snapPoints[index]
      if (ratio != null) onSnapChange?.(ratio)
    },
    [snapPoints, onSnapChange, onClose],
  )

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={defaultSnapIndex}
      snapPoints={percentPoints}
      enablePanDownToClose={isOpen != null}
      onChange={handleChange}
      backgroundStyle={[styles.background, sxToStyle(sx)]}
      handleIndicatorStyle={styles.handle}
    >
      {children}
    </GorhomBottomSheet>
  )
}

function Header({ children, rightElement, sx, ...props }: StackProps & { rightElement?: ReactNode }) {
  return (
    <BottomSheetView>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1, ...(sx ?? {}) }}
        {...props}
      >
        {children}
        {rightElement}
      </Stack>
    </BottomSheetView>
  )
}

function Body({ children, sx, ...props }: BoxProps) {
  return (
    <BottomSheetScrollView contentContainerStyle={sxToStyle(sx)}>
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
    <BottomSheetView>
      <Stack direction="row" gap={1} sx={{ px: 2, py: 1, ...(sx ?? {}) }} {...props}>
        {children}
      </Stack>
    </BottomSheetView>
  )
}

BottomSheet.Header = Header
BottomSheet.Body = Body
BottomSheet.Scrollable = Scrollable
BottomSheet.BottomActions = BottomActions

const styles = StyleSheet.create({
  background: { backgroundColor: palette.background, borderRadius: 20 },
  handle: { backgroundColor: palette.divider, width: 40 },
})
