import { Avatar, Stack, Typography } from '../../shared/components/mui'
import { palette } from '../../shared/config/tokens'
import { useUserProfile } from './useUserProfile'

export function ProfileHeader({ userId }: { userId: string }) {
  const { data: profile } = useUserProfile(userId)

  if (profile == null) {
    return <Typography color="text.secondary">존재하지 않는 사용자에요</Typography>
  }

  return (
    <Stack direction="row" alignItems="center" sx={{ paddingHorizontal: 16, paddingVertical: 16, gap: 16 }}>
      <Avatar src={profile.profileUrl ?? undefined} sx={{ width: 72, height: 72, backgroundColor: palette.primary }}>
        {profile.name?.[0] ?? '?'}
      </Avatar>
      <Typography sx={{ fontSize: 20, fontWeight: 'bold', color: palette.text }}>
        {profile.name}
      </Typography>
    </Stack>
  )
}
