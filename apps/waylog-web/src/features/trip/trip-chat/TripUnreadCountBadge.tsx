import { keyframes, Stack, Typography, type StackProps } from '@mui/material'
import { useTripUnreadCount } from '@waylog/domains/modules/trip-chat'

interface Props extends StackProps {
  tripId: string
  variant?: 'fill' | 'outline'
}

const popIn = keyframes`
  0%   { scale: 0; animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
  60%  { scale: 1.2; animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1); }
  100% { scale: 1; }
`

const POP_IN_DURATION_MS = 300

export function TripUnreadCountBadge({ tripId, variant = 'fill', sx, ...props }: Props) {
  const count = useTripUnreadCount(tripId)
  if (count === 0) return null

  const isFill = variant === 'fill'
  const callerSx = Array.isArray(sx) ? sx : [sx]

  return (
    <Stack
      paddingX={1}
      paddingY={0.25}
      borderRadius={3}
      bgcolor={isFill ? 'primary.main' : 'white'}
      border={isFill ? 'none' : '1px solid'}
      borderColor={isFill ? undefined : 'primary.main'}
      alignItems="center"
      justifyContent="center"
      minWidth="24px"
      minHeight="24px"
      sx={[{ animation: `${popIn} ${POP_IN_DURATION_MS}ms both` }, ...callerSx]}
      {...props}
    >
      <Typography
        sx={{ fontSize: 11, fontWeight: 700, color: isFill ? 'white' : 'primary.main', lineHeight: 1 }}
      >
        {count > 99 ? '99+' : count}
      </Typography>
    </Stack>
  )
}
