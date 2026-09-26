import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

// 출발과 도착은 한 쌍으로 읽힌다. 라벨을 따로 달면 둘이 짝이라는 것이 흐려진다.
export function FieldPair({
  label,
  required = true,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <Stack gap={0.75} flex={1} minWidth={0}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
        {label}
        {required && (
          <>
            {' '}
            <Typography component="span" variant="caption" color="error">
              *
            </Typography>
          </>
        )}
      </Typography>
      <Stack direction="row" alignItems="center" gap={1}>
        {children}
      </Stack>
    </Stack>
  )
}

export function RouteArrow() {
  return <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
}
