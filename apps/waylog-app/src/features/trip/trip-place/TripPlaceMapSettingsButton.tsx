import { MaterialIcons } from '@expo/vector-icons'
import { IconButton } from '~shared/components/design-system/IconButton'
import { useOverlay } from '~shared/hooks/useOverlay'
import { TripPlaceMapConfigDialog } from './TripPlaceMapConfigDialog'

export function TripPlaceMapSettingsButton() {
  const overlay = useOverlay()

  const openSettingDialog = () => {
    overlay.open(({ isOpen, close, onClose }) => (
      <TripPlaceMapConfigDialog isOpen={isOpen} onDismiss={close} onRequestClose={onClose} />
    ))
  }

  return (
    <IconButton accessibilityLabel="지도 설정" onPress={openSettingDialog}>
      <MaterialIcons name="settings" size={20} />
    </IconButton>
  )
}
