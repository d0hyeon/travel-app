import { Avatar, type AvatarProps } from '@mui/material'
import type { TripMember } from './tripMember.types'

interface Props extends AvatarProps {
  member: Pick<TripMember, 'name' | 'avatarUrl'>
  size?: number
}

export function MemberAvatar({ member, size = 28, sx, ...props }: Props) {
  return (
    <Avatar
      src={member.avatarUrl ?? undefined}
      sx={{ width: size, height: size, fontSize: size * 0.5, ...sx }}
      {...props}
    >
      {member.name?.[0] ?? '?'}
    </Avatar>
  )
}
