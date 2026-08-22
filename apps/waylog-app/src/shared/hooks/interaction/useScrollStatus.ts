import { useCallback, useRef, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

/** 웹 useScrollStatus의 RN 대응 훅. 스크롤 방향만 공통 관심사로 분리한다. */
export function useScrollStatus() {
  const [isScrollDown, setIsScrollDown] = useState(false)
  const previousOffset = useRef(0)

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = Math.max(event.nativeEvent.contentOffset.y, 0)
    if (offset <= 0) setIsScrollDown(false)
    else if (offset > previousOffset.current + 2) setIsScrollDown(true)
    else if (offset < previousOffset.current - 2) setIsScrollDown(false)
    previousOffset.current = offset
  }, [])

  return { isScrollDown, onScroll }
}
