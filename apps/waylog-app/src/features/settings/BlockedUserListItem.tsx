import type { UserProfile } from '@waylog/domains/modules/user-profile'
import { StyleSheet } from 'react-native'
import { Avatar, Button, Stack, Typography } from '~shared/components/design-system'

interface Props {
  user: UserProfile
  onUnblock: () => void
}

export function BlockedUserListItem({ user, onUnblock }: Props) {
  return (
    <Stack direction="row" alignItems="center" style={styles.row}>
      <Avatar src={user.profileUrl ?? undefined}>{user.name?.[0] ?? '?'}</Avatar>
      <Typography variant="body1" style={styles.name}>{user.name}</Typography>
      <Button variant="outlined" onPress={onUnblock}>차단 해제</Button>
    </Stack>
  )
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, gap: 12 },
  name: { flex: 1 },
})
