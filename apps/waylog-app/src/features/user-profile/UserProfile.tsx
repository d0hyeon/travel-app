import { assert } from '@waylog/utility'
import { Avatar, Stack, Typography, type StackProps } from '../../shared/components/mui'
import { useUserProfile } from './useUserProfile'

export const UserProfileSize = {
  small: 'small',
  medium: 'medium',
  large: 'large',
} as const
export type UserProfileSize = typeof UserProfileSize[keyof typeof UserProfileSize]

const USER_PROFILE_SIZE_STYLE = {
  [UserProfileSize.small]: {
    avatar: 20,
    fontSize: 11,
  },
  [UserProfileSize.medium]: {
    avatar: 28,
    fontSize: 13,
  },
  [UserProfileSize.large]: {
    avatar: 36,
    fontSize: 15,
  },
} as const

interface Props extends StackProps {
  id: string
  size?: UserProfileSize
}

export function UserProfile({ id, size = UserProfileSize.medium, ...props }: Props) {
  const { data: profile } = useUserProfile(id)
  const sizeStyle = USER_PROFILE_SIZE_STYLE[size]

  assert(profile != null, '존재하지 않는 사용자 ID입니다.')

  return (
    <Stack direction="row" alignItems="center" gap={1} {...props}>
      <Avatar
        src={profile.profileUrl ?? undefined}
        sx={{ width: sizeStyle.avatar, height: sizeStyle.avatar, fontSize: sizeStyle.avatar * 0.5 }}
      >
        {profile.name?.[0] ?? '?'}
      </Avatar>
      <Typography sx={{ fontSize: sizeStyle.fontSize, lineHeight: 1.2 }} numberOfLines={1}>
        {profile.name}
      </Typography>
    </Stack>
  )
}
