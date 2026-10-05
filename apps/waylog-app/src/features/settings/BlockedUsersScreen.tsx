import { AuthGuard } from '@waylog/domains/clients'
import { useBlockedUsers, useUnblockUser } from '@waylog/domains/modules/user-block'
import { FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppRoute } from '~app/AppRoute'
import { SignedOutRedirect } from '~features/auth/auth-redirect'
import { Typography } from '~shared/components/design-system'
import { AppBar } from '~shared/components/design-system/AppBar'
import { palette } from '~shared/config/tokens'
import { BlockedUserListItem } from './BlockedUserListItem'
import { toast } from 'sonner-native'

export function BlockedUsersScreen() {
  return (
    <AuthGuard fallback={<SignedOutRedirect />}>
      <SafeAreaView style={styles.root}>
        <AppBar title="차단한 사용자" />
        <BlockedUserList />
      </SafeAreaView>
    </AuthGuard>
  )
}

function BlockedUserList() {
  const { data: blockedUsers } = useBlockedUsers()

  return (
    <FlatList
      data={blockedUsers}
      keyExtractor={(user) => user.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <BlockedUserListItem user={item} />}
      ListEmptyComponent={<Typography color="text.secondary" style={styles.empty}>차단한 사용자가 없어요</Typography>}
    />
  )
}

declare module '~app/routes' {
  interface RouteParamsRegistry {
    [AppRoute.차단_목록]: undefined
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  list: { paddingHorizontal: 16 },
  empty: { textAlign: 'center', paddingVertical: 48 },
})
