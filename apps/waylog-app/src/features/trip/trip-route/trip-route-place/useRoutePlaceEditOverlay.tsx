import { AsyncBoundary } from '@waylog/react'
import { useCallback } from 'react'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { CommonErrorAlert } from '~shared/components/CommonErrorAlert'
import { KeyboardDismissArea } from '~shared/components/KeyboardDismissArea'
import { useOverlay } from '~shared/hooks/useOverlay'
import { RoutePlaceEditSheet } from './RoutePlaceEditSheet'

interface OpenParams {
  tripId: string
  routeId: string
  placeId: string
}

export function useRoutePlaceEditOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (params: OpenParams) => {
      return new Promise<void>((resolve) => {
        overlay.open(({ isOpen, close, onClose }) => (
          <KeyboardDismissArea>
            <BottomSheet
              isOpen={isOpen}
              safeArea
              onDismiss={close}
              onClose={onClose}
              snapPoints={[0.6]}
              defaultSnapIndex={0}
            >
              <AsyncBoundary
                pendingFallback={<ActivityIndicator style={styles.pending} />}
                rejectedFallback={({ error, resetError }) => (
                  <CommonErrorAlert
                    message={error.message}
                    action={<CommonErrorAlert.RetryButton onPress={resetError} />}
                  />
                )}
              >
                <RoutePlaceEditSheet
                  {...params}
                  onClose={() => {
                    resolve()
                    return close()
                  }}
                />
              </AsyncBoundary>
            </BottomSheet>
          </KeyboardDismissArea>
        ))
      })
    },
    [overlay],
  )

  return { open }
}

const styles = StyleSheet.create({
  pending: { flex: 1 },
})
