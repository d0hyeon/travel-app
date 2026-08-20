import type { RouteLeg } from '@waylog/domains/route'
import { formatDistance, formatDuration } from '@waylog/domains/utils'
import { Stack, Text } from '../../../shared/components'
import { palette } from '../../../shared/config/tokens'

const TRANSPORT_LABEL: Record<string, string> = {
  CAR: '자동차',
  TRANSIT: '대중교통',
  WALK: '도보',
}

export function RouteLegItem({ leg }: { leg: RouteLeg }) {
  return (
    <Stack direction="row" gap={4} align="center">
      <Text variant="caption" color={palette.textSecondary}>
        {TRANSPORT_LABEL[leg.transport] ?? leg.transport} · {formatDuration(leg.duration)} ·{' '}
        {formatDistance(leg.distance)}
      </Text>
    </Stack>
  )
}
