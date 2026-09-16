import type { FlightSearchResult } from '@waylog/domains/modules/transport'
import { useCallback } from 'react'
import { FullScreenPopup } from '../../../../shared/components/FullScreenPopup'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { FlightSearchPanel } from './FlightSearchPanel'

// 항공편 검색은 진행 스텝이 아니라 필드 하나를 채우는 보조 동작이다.
// 퍼널 스택에 두면 진행률에서 매번 예외로 빼야 한다.
export function useFlightSearchOverlay() {
  const overlay = useOverlay()

  const open = useCallback(() => {
    return new Promise<FlightSearchResult | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <FullScreenPopup isOpen={isOpen} onClose={close}>
          <FlightSearchPanel
            onSelect={(flight) => {
              close()
              resolve(flight)
            }}
            onClose={() => {
              close()
              resolve(null)
            }}
          />
        </FullScreenPopup>
      ))
    })
  }, [overlay])

  return { open }
}
