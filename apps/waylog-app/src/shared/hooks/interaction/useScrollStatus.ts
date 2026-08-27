import { useCallback, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

/**
 * 방향이 바뀌었다고 인정할 최소 이동량.
 *
 * 감속·바운스 구간의 미세 진동이 방향 전환으로 읽히면
 * 이 값을 구독하는 레이아웃이 떨린다.
 */
const DIRECTION_THRESHOLD = 8

/** 웹 useScrollStatus의 RN 대응 훅. 스크롤 방향만 공통 관심사로 분리한다. */
export function useScrollStatus() {
  const [isScrollDown, setIsScrollDown] = useState(false)
  const previousOffset = useRef(0)

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    const offset = contentOffset.y
    const maxOffset = contentSize.height - layoutMeasurement.height

    /**
     * 양 끝을 넘어선 바운스 구간은 방향을 판단하지 않는다.
     * 손을 뗀 뒤 되돌아오는 움직임이라 사용자의 의도가 아니다.
     */
    const isBouncing = offset < 0 || offset > maxOffset
    if (isBouncing) return

    if (offset <= 0) setIsScrollDown(false)
    else if (offset > previousOffset.current + DIRECTION_THRESHOLD) setIsScrollDown(true)
    else if (offset < previousOffset.current - DIRECTION_THRESHOLD) setIsScrollDown(false)
    else return

    previousOffset.current = offset
  }, [])

  return { isScrollDown, onScroll }
}
