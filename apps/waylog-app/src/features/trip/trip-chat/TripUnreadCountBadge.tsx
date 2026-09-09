import { StyleSheet } from 'react-native'
import { useUnreadChatCount } from '@waylog/domains/modules/trip-chat'
import { Suspense } from 'react'
import { Box, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import type { StyleProp, ViewStyle } from 'react-native'

interface Props {
  tripId: string
  variant?: 'fill' | 'outline'
  style?: StyleProp<ViewStyle>
}

export function TripUnreadCountBadge(props: Props) {
  return (
    <Suspense fallback={null}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ tripId, variant = 'fill', style }: Props) {
  const count = useUnreadChatCount(tripId)
  if (count === 0) return null

  const isFill = variant === 'fill'

  return (
    <Box
      style={[
        [styles.badge, { backgroundColor: isFill ? palette.primary : '#fff', borderWidth: isFill ? 0 : 1, borderColor: isFill ? undefined : palette.primary }],
        style,
      ]}
    >
      <Typography
        style={[styles.count, { color: isFill ? '#fff' : palette.primary }]}
      >
        {count > 99 ? '99+' : count}
      </Typography>
    </Box>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minWidth: 24, minHeight: 24 },
  count: { fontSize: 11, fontWeight: '700', lineHeight: 13 },
})
