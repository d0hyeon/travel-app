import { useUnblockUser } from '@waylog/domains/modules/user-block'
import type { UserProfile } from '@waylog/domains/modules/user-profile'
import { useLoading } from '@waylog/react'
import { StyleSheet } from 'react-native'
import { toast } from 'sonner-native'
import { Avatar, Button, Stack, Typography } from '~shared/components/design-system'

interface Props {
  user: UserProfile
}

export function BlockedUserListItem({ user }: Props) {
  const unblockUser = useUnblockUser();

  const handlePress = async () => {
    await unblockUser(user.id);
    toast.success('차단을 해제했어요');
  }

  return (
    <Stack direction="row" alignItems="center" style={styles.row}>
      <Avatar src={user.profileUrl ?? undefined}>{user.name?.[0] ?? '?'}</Avatar>
      <Typography variant="body1" style={styles.name}>{user.name}</Typography>
      <Button loading={unblockUser.isPending} variant="outlined" onPress={handlePress}>차단 해제</Button>
    </Stack>
  )
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, gap: 12 },
  name: { flex: 1 },
})
