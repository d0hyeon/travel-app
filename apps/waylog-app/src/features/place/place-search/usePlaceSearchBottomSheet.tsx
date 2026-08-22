import type { PlaceResult } from '@waylog/domains/modules/place'
import { useCallback } from 'react'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { PlaceSearchBottomSheet, type PlaceSearchBottomSheetProps } from './PlaceSearchBottomSheet'

type Options = Pick<PlaceSearchBottomSheetProps, 'service' | 'center'>

// 웹 usePlaceSearchBottomSheet 와 같은 시그니처를 유지한다.
export function usePlaceSearchBottomSheet(options: Options = {}) {
  const overlay = useOverlay()

  const searchPlace = useCallback(() => {
    return new Promise<PlaceResult | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <PlaceSearchBottomSheet
          {...options}
          isOpen={isOpen}
          onClose={() => {
            close()
            resolve(null)
          }}
          onSelect={(data) => {
            close()
            resolve(data)
          }}
        />
      ))
    })
  }, [overlay, options])

  return { searchPlace }
}
