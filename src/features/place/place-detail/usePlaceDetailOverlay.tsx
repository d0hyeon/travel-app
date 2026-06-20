import { useTheme } from '@mui/material'
import { useCallback } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { PlaceDetailBottomSheet } from './PlaceDetailBottomSheet'
import { PlaceSidePanel } from './PlaceSidePanel'

/**
 * 장소 상세 오버레이를 띄운다.
 * - 모바일: 바텀시트
 * - 데스크탑: 사이드시트
 *
 * 다른 오버레이(장소 수정 등) 위에 띄울 수 있도록 z-index를 modal 위로 올린다.
 */
export function usePlaceDetailOverlay() {
  const overlay = useOverlay()
  const isMobile = useIsMobile()
  const theme = useTheme()

  const open = useCallback((placeId: string) => {
    overlay.open(({ isOpen, close }) => (
      isMobile
        ? <PlaceDetailBottomSheet placeId={placeId} isOpen={isOpen} onClose={close} />
        : <PlaceSidePanel placeId={placeId} isOpen={isOpen} onClose={close} zIndex={theme.zIndex.modal + 1} />
    ))
  }, [overlay, isMobile, theme.zIndex.modal])

  return { open }
}
