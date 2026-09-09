import { assert } from '@waylog/utility'
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native'
import { Avatar, Stack, Typography, type StackProps } from '~/shared/components/design-system'
import { useUserProfile } from './useUserProfile'

export const UserProfileSize = {
  small: 'small',
  medium: 'medium',
  large: 'large',
} as const
export type UserProfileSize = typeof UserProfileSize[keyof typeof UserProfileSize]


interface Props extends StackProps {
  id: string
  size?: UserProfileSize
}

export function UserProfile({ id, size = UserProfileSize.medium, ...props }: Props) {
  const { data: profile } = useUserProfile(id)
  const style = stylesBySize[size]

  assert(profile != null, '존재하지 않는 사용자 ID입니다.')

  return (
    <Stack direction="row" alignItems="center" gap={1} {...props}>
      <Avatar
        src={profile.profileUrl ?? undefined}
        style={style.avatar}
      >
        {profile.name?.[0] ?? '?'}
      </Avatar>
      <Typography style={style.text} numberOfLines={1}>
        {profile.name}
      </Typography>
    </Stack>
  )
}


const stylesBySize = {
  [UserProfileSize.small]: StyleSheet.create({
    avatar: { width: 20, height: 20, fontSize: 20 * 0.5 },
    text: { fontSize: 11 }
  }),
  [UserProfileSize.medium]: StyleSheet.create({
    avatar: { width: 28, height: 28, fontSize: 28 * 0.5 },
    text: { fontSize: 13 }
  }),
  [UserProfileSize.large]: StyleSheet.create({
    avatar: { width: 36, height: 36, fontSize: 36 * 0.5 },
    text: { fontSize: 15 }
  })
}