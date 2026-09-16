import { searchAirports, type Airport } from '@waylog/domains/modules/airport'
import { useCallback } from 'react'
import { View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { FullScreenPopup } from '../../../../shared/components/FullScreenPopup'
import { palette } from '../../../../shared/config/tokens'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { SearchSelectPanel } from './SearchSelectPanel'

export function useAirportSelectOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (title: string) => {
      return new Promise<Airport | null>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <FullScreenPopup isOpen={isOpen} onClose={close}>
            <SearchSelectPanel
              title={title}
              placeholder="예: 인천공항, ICN, 오사카"
              search={searchAirports}
              getKey={(airport) => airport.code}
              renderItem={(airport) => (
                <View>
                  <Typography style={{ fontSize: 13.5, fontWeight: '700' }}>
                    {airport.nameKo}
                  </Typography>
                  <Typography style={{ fontSize: 12, color: palette.textSecondary }}>
                    {airport.code} · {airport.cityKo}
                  </Typography>
                </View>
              )}
              onSelect={(airport) => {
                close()
                resolve(airport)
              }}
              onClose={() => {
                close()
                resolve(null)
              }}
            />
          </FullScreenPopup>
        ))
      })
    },
    [overlay],
  )

  return { open }
}
