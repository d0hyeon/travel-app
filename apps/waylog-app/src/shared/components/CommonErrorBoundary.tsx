import type { ComponentProps } from 'react'
import { palette, radius } from '../config/tokens'
import { ErrorBoundary } from '@waylog/react'
import { Button, Stack, Typography } from '~/shared/components/design-system'

const ERROR_MAIN = '#d32f2f'
const ERROR_SURFACE = '#fdeded'

// 웹 shared/components/CommonErrorBoundary.tsx 와 같은 역할이다.
// 웹은 MUI Alert 를 쓰지만 앱 shim 에는 Alert 가 없어 같은 구성을 직접 그린다.
export function CommonErrorBoundary(props: ComponentProps<typeof ErrorBoundary>) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={8}
          style={{
            margin: 16,
            marginHorizontal: 12,
            padding: 12,
            borderRadius: radius.md,
            backgroundColor: ERROR_SURFACE,
          }}
        >
          <Stack gap={2} style={{ flexShrink: 1 }}>
            <Typography variant="subtitle1" color={ERROR_MAIN}>
              에러가 발생했어요!
            </Typography>
            <Typography variant="caption" color={palette.textSecondary}>
              {error.message}
            </Typography>
          </Stack>

          <Button size="small" variant="contained" color="error" onPress={resetError}>
            재시도
          </Button>
        </Stack>
      )}
      {...props}
    />
  )
}
