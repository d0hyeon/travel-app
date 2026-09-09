import { MaterialIcons } from '@expo/vector-icons'
import { IconButton } from '~/shared/components/design-system/IconButton'
import { palette } from '../../../../shared/config/tokens'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { FloatingControl } from '../../components/FloatingControl'
import { TripRouteMapConfigDialog } from './TripRouteMapConfigDialog'

export function TripRouteMapFloatingControls() {
  const overlay = useOverlay()

  const openSettingDialog = () => {
    overlay.open(({ isOpen, close, onClose }) => (
      <TripRouteMapConfigDialog isOpen={isOpen} onDismiss={close} onRequestClose={onClose} />
    ))
  }

  return (
    <FloatingControl corner="top-right" zIndex={8}>
      <IconButton onPress={openSettingDialog}>
        <MaterialIcons name="settings" size={22} color={palette.info} />
      </IconButton>
    </FloatingControl>
  )
}

