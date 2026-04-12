import { Avatar, type AvatarProps } from '@mui/material';
import type { TripMember } from './tripMember.types';

interface Props extends AvatarProps {
  member: TripMember;
  size?: number
}

export function MemberAvatar({ member, size = 28, sx, ...props }: Props) {

  return (
    <Avatar
      src={member.profileUrl ?? undefined}
      sx={{ width: size, height: size, fontSize: size * 0.5, ...sx }}
      {...props}
    >
      {member.name?.[0] ?? '?'}
    </Avatar>
  )
}
