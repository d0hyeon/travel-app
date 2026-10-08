import { StyleSheet } from 'react-native'
import { Avatar, Skeleton, Stack, Typography } from '~shared/components/design-system'
import { palette } from '~shared/config/tokens'
import { useUserProfile } from './useUserProfile'

export function ProfileHeader({ userId }: { userId: string }) {
  const { data: profile } = useUserProfile(userId)

  if (profile == null) {
    return <Typography color="text.secondary">존재하지 않는 사용자에요</Typography>
  }

  return (
    <Stack direction="row" alignItems="center" style={styles.header}>
      <Avatar src={profile.profileUrl ?? undefined} style={styles.avatar}>
        {profile.name?.[0] ?? '?'}
      </Avatar>
      <Typography style={styles.name}>
        {profile.name}
      </Typography>
    </Stack>
  )
}

ProfileHeader.Skeleton = function ProfileHeaderSkeleton() {
  return (
    <Stack direction="row" alignItems="center" style={styles.header}>
      <Skeleton variant="circular" width={AVATAR_SIZE} height={AVATAR_SIZE} />
      <Skeleton width={120} height={24} />
    </Stack>
  )
}

const AVATAR_SIZE = 72

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 16, gap: 16 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, backgroundColor: palette.primary },
  name: { fontSize: 20, fontWeight: 'bold', color: palette.text },
})
