import { Avatar, Stack, Typography, type StackProps } from '@mui/material'
import { useUserProfile } from './useUserProfile'
import { assert } from '~shared/utils/types'

export const UserProfileSize = {
  small: 'small',
  medium: 'medium',
  large: 'large',
} as const
export type UserProfileSize = typeof UserProfileSize[keyof typeof UserProfileSize]

const USER_PROFILE_SIZE_STYLE = {
  [UserProfileSize.small]: {
    avatar: 20,
    textVariant: 'caption',
  },
  [UserProfileSize.medium]: {
    avatar: 28,
    textVariant: 'body2',
  },
  [UserProfileSize.large]: {
    avatar: 36,
    textVariant: 'body1',
  },
} as const

interface Props extends StackProps {
  id: string
  size?: UserProfileSize
}

export function UserProfile({ id, size = UserProfileSize.medium, sx, ...props }: Props) {
  const { data: profile } = useUserProfile(id)
  const sizeStyle = USER_PROFILE_SIZE_STYLE[size]

  assert(!!profile, '존재하지 않는 사용자 ID입니다.');

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={sx}
      {...props}
    >
      <Avatar
        src={profile.profileUrl ?? undefined}
        sx={{ width: sizeStyle.avatar, height: sizeStyle.avatar, fontSize: sizeStyle.avatar * 0.5 }}
      >
        {profile.name?.[0] ?? '?'}
      </Avatar>
      <Typography
        variant={sizeStyle.textVariant}
        noWrap
        sx={{ lineHeight: 1.2 }}
      >
        {profile.name}
      </Typography>
    </Stack>
  )
}
