import { MaterialIcons } from '@expo/vector-icons'
import { Toaster } from 'sonner-native'
import { palette } from '~shared/config/tokens'

const ICON_SIZE = 20

export function ToastRenderer() {
  return (
    <Toaster
      position="top-center"
      icons={{
        info: <MaterialIcons name="info" size={ICON_SIZE} color={palette.info} />,
        success: <MaterialIcons name="check" size={ICON_SIZE} color={palette.success} />,
        warning: <MaterialIcons name="info" size={ICON_SIZE} color={palette.warning} />,
        error: <MaterialIcons name="report" size={ICON_SIZE} color={palette.error} />,
      }}
      toastOptions={{
        style: {
          borderRadius: 20,
          paddingVertical: 16,
          backgroundColor: palette.background,
          borderWidth: 0,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        },
        titleStyle: {
          fontFamily: 'SUIT',
          fontSize: 14,
          color: palette.text,
        },
        descriptionStyle: {
          fontFamily: 'SUIT',
          color: palette.textSecondary,
        },
      }}
    />
  )
}
