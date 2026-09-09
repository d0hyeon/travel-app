import type { TripMember } from '@waylog/domains/modules/trip-member'
import { palette } from '../../../shared/config/tokens'
import { Box, Typography } from '~/shared/components/design-system'
import type { StyleProp, ViewStyle } from 'react-native'
import { LoadableImage } from '../../../shared/components/LoadableImage'

interface Props {
  member: TripMember
  size?: number
  style?: StyleProp<ViewStyle>
}

export function MemberAvatar({ member, size = 28, style }: Props) {
  return (
    <Box
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(0,0,0,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {member.profileUrl != null ? (
        <LoadableImage source={{ uri: member.profileUrl }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Typography style={{ fontSize: size * 0.5, color: palette.text }}>
          {member.name?.[0] ?? '?'}
        </Typography>
      )}
    </Box>
  )
}
