import { StyleSheet } from 'react-native'
import type { ComponentProps } from 'react'
import { palette, radius } from '../config/tokens'
import { ErrorBoundary } from '@waylog/react'
import { Button, Stack, Typography } from '~/shared/components/design-system'
import { CommonErrorAlert } from './CommonErrorAlert'

const ERROR_MAIN = '#d32f2f'
const ERROR_SURFACE = '#fdeded'

// 웹 shared/components/CommonErrorBoundary.tsx 와 같은 역할이다.
// 웹은 MUI Alert 를 쓰지만 앱 shim 에는 Alert 가 없어 같은 구성을 직접 그린다.
export function CommonErrorBoundary(props: ComponentProps<typeof ErrorBoundary>) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <CommonErrorAlert
          message={error.message}
          action={<CommonErrorAlert.RetryButton onPress={resetError} />}
        />
      )}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: ERROR_SURFACE,
  },
  message: {
    flexShrink: 1,
  },
})
