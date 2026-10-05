import { View } from 'react-native'
import { toast as sonnerToast, type ToastAction } from 'sonner-native'

type ShowToast = typeof sonnerToast.info
type ToastOptions = Parameters<ShowToast>[1]

function isToastAction(action: NonNullable<ToastOptions>['action']): action is ToastAction {
  return typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action
}

function dismissOnAction(show: ShowToast): ShowToast {
  return (title, options) => {
    const action = options?.action
    if (!isToastAction(action)) return show(title, options)

    const toastId = show(title, {
      ...options,
      action: {
        ...action,
        onClick: () => {
          action.onClick()
          sonnerToast.dismiss(toastId)
        },
      },
    })
    return toastId
  }
}

const showToast = dismissOnAction(sonnerToast)

function openToast(title: string, options?: ToastOptions) {
  return showToast(title, {
    ...options,
    icon: <View />,
    styles: { ...options?.styles, toastContent: { ...options?.styles?.toastContent, gap: 0 } },
  })
}

export const toast = Object.assign(openToast, {
  success: dismissOnAction(sonnerToast.success),
  error: dismissOnAction(sonnerToast.error),
  info: dismissOnAction(sonnerToast.info),
})
