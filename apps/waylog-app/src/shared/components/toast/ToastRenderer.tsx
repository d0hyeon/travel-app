import { MaterialIcons } from '@expo/vector-icons'
import { Toaster, type ToastStyles } from 'sonner-native'
import { palette } from '~shared/config/tokens'

const ICON_SIZE = 20
const ACTION_BUTTON_WIDTH = 48
const ACTION_BUTTON_RADIUS = 8

export const actionToastStyles: ToastStyles = {
  title: { paddingRight: ACTION_BUTTON_WIDTH },
  description: { paddingRight: ACTION_BUTTON_WIDTH },
}

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
        buttonsStyle: {
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          marginTop: 0,
          alignItems: 'center',
        },
        actionButtonStyle: {
          alignSelf: 'center',
          borderRadius: ACTION_BUTTON_RADIUS,
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
