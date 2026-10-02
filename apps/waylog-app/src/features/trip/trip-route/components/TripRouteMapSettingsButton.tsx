import { MaterialIcons } from '@expo/vector-icons'
import { IconButton } from '~/shared/components/design-system/IconButton'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { TripRouteMapConfigDialog } from '../trip-route-configuration/TripRouteMapConfigDialog'

export function TripRouteMapSettingsButton() {
  const overlay = useOverlay()

  const openSettingDialog = () => {
    overlay.open(({ isOpen, close, onClose }) => (
      <TripRouteMapConfigDialog isOpen={isOpen} onDismiss={close} onRequestClose={onClose} />
    ))
  }

  return (
    <IconButton accessibilityLabel="지도 설정" onPress={openSettingDialog}>
      <MaterialIcons name="settings" size={20} />
    </IconButton>
  )
}
