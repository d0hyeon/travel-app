import { List, Stack, Typography } from '@mui/material'
import { useBlockedUsers } from '@waylog/domains/modules/user-block'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { BlockedUserListItem } from './BlockedUserListItem'

export default function BlockedUsersPage() {
  const { data: blockedUsers } = useBlockedUsers()

  return (
    <Stack>
      <TopNavigation position="sticky" sx={{ borderBottomWidth: 0 }}>
        차단한 사용자
      </TopNavigation>
      {blockedUsers.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
          차단한 사용자가 없어요
        </Typography>
      ) : (
        <List disablePadding>
          {blockedUsers.map((user) => (
            <BlockedUserListItem key={user.id} user={user} />
          ))}
        </List>
      )}
    </Stack>
  )
}
