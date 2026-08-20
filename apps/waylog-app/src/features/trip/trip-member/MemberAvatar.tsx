import type { TripMember } from '@waylog/domains/trip-member'
import { Image } from 'react-native'
import { palette } from '../../../shared/config/tokens'
import { Box, Typography } from '../../../shared/components/mui'
import type { Sx } from '../../../shared/components/mui'

interface Props {
  member: TripMember
  size?: number
  sx?: Sx
}

export function MemberAvatar({ member, size = 28, sx }: Props) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(0,0,0,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...(sx ?? {}),
      }}
    >
      {member.profileUrl != null ? (
        <Image source={{ uri: member.profileUrl }} style={{ width: size, height: size }} />
      ) : (
        <Typography sx={{ fontSize: size * 0.5, color: palette.text }}>
          {member.name?.[0] ?? '?'}
        </Typography>
      )}
    </Box>
  )
}
