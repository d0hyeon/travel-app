import { CommonErrorAlert } from '../../../../shared/components/CommonErrorAlert'

interface Props {
  message: string
  onRetry: () => void
}

export function TransportDetailSectionError({ message, onRetry }: Props) {
  return (
    <CommonErrorAlert
      message={message}
      action={<CommonErrorAlert.RetryButton onPress={onRetry} />}
    />
  )
}
