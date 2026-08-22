import { useUnreadChatCount } from '@waylog/domains/modules/trip-chat'
import { Box, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import type { Sx } from '../../../shared/components/mui'

interface Props {
  tripId: string
  variant?: 'fill' | 'outline'
  sx?: Sx
}

export function TripUnreadCountBadge({ tripId, variant = 'fill', sx }: Props) {
  const count = useUnreadChatCount(tripId)
  if (count === 0) return null

  const isFill = variant === 'fill'

  return (
    <Box
      sx={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: isFill ? palette.primary : '#fff',
        borderWidth: isFill ? 0 : 1,
        borderColor: isFill ? undefined : palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 24,
        minHeight: 24,
        ...(sx ?? {}),
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: '700',
          color: isFill ? '#fff' : palette.primary,
          lineHeight: 13,
        }}
      >
        {count > 99 ? '99+' : count}
      </Typography>
    </Box>
  )
}
