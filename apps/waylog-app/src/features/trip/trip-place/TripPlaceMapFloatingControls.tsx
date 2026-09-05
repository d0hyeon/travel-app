import { MaterialIcons } from '@expo/vector-icons'
import { IconButton } from '../../../shared/components/mui/IconButton'
import { palette } from '../../../shared/config/tokens'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { FloatingControl } from '../components/FloatingControl'
import { TripPlaceMapConfigDialog } from './TripPlaceMapConfigDialog'

export function TripPlaceMapFloatingControls() {
  const overlay = useOverlay()

  const openSettingDialog = () => {
    overlay.open(({ isOpen, close, onClose }) => (
      <TripPlaceMapConfigDialog isOpen={isOpen} onDismiss={close} onRequestClose={onClose} />
    ))
  }

  return (
    <FloatingControl corner="top-right" zIndex={8}>
      <IconButton onClick={openSettingDialog}>
        <MaterialIcons name="settings" size={22} color={palette.info} />
      </IconButton>
    </FloatingControl>
  )
}

