import { searchAirlines, type Airline } from '@waylog/domains/modules/airline'
import { useCallback } from 'react'
import { View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { FullScreenPopup } from '../../../../shared/components/FullScreenPopup'
import { palette } from '../../../../shared/config/tokens'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { SearchSelectPanel } from './SearchSelectPanel'

export function useAirlineSelectOverlay() {
  const overlay = useOverlay()

  const open = useCallback(() => {
    return new Promise<Airline | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <FullScreenPopup isOpen={isOpen} onClose={close}>
          <SearchSelectPanel
            title="항공사 선택"
            placeholder="예: 대한항공, KE"
            search={searchAirlines}
            getKey={(airline) => airline.code}
            renderItem={(airline) => (
              <View>
                <Typography style={{ fontSize: 13.5, fontWeight: '700' }}>
                  {airline.nameKo}
                </Typography>
                <Typography style={{ fontSize: 12, color: palette.textSecondary }}>
                  {airline.code}
                </Typography>
              </View>
            )}
            onSelect={(airline) => {
              close()
              resolve(airline)
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
