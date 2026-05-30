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

  /**
   * @TODO 
   * useLocationOverlay -> defaultValue를 받는 함수 반환
   *  -> 훅의 정의와 함수 시그니처가 충분히 표현되지 못함.
   * 
   * [개선 예시]
   *   useLocationOverlay -> selectLocation({ defaultValue }) 
   *   위처럼 기명화를 통해 함수의 역할과 시그니처를 명확히 표현할 수 있다. (오버레이 형태로 지역을 선택)
   */
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
