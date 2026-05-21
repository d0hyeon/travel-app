import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, IconButton } from '@mui/material'
import { useCallback } from 'react'
import type { Location } from '~features/location'
import { LocationForm } from '~features/location/LocationForm'
import { BottomArea } from '~shared/components/BottomArea'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useOverlay } from '~shared/hooks/useOverlay'

export function useLocationOverlay() {
  const overlay = useOverlay()

  return useCallback((defaultValue?: Location) => {
    return new Promise<Location | null | undefined>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <FullScreenPopup isOpen={isOpen} onClose={() => { resolve(undefined); close() }}>
          <TopNavigation
            position="sticky"
            leftElement={null}
            rightElement={
              <IconButton size="small" onClick={() => { resolve(undefined); close() }}>
                <CloseIcon />
              </IconButton>
            }
          >
            지역 선택
          </TopNavigation>
          <Box sx={{ overflowY: 'auto' }}>
            <LocationForm
              defaultValue={defaultValue}
              onSubmit={(value) => { resolve(value); close() }}
              paddingTop={3}
            >
              <BottomArea position="fixed" bottom={0}>
                <Button
                  type="button"
                  color="error"
                  variant="outlined"
                  size="large"
                  onClick={() => { resolve(null); close() }}
                  fullWidth
                >
                  초기화
                </Button>
                <LocationForm.SubmitButton variant="contained" size="large" fullWidth>
                  확인
                </LocationForm.SubmitButton>
              </BottomArea>
            </LocationForm>
          </Box>
        </FullScreenPopup>
      ))
    })
  }, [overlay])
}
