import { List, Stack, Typography } from '@mui/material'
import { useBlockedUsers } from '@waylog/domains/modules/user-block'
import { ContentContainer } from '~shared/components/layout/ContentContainer'
import { TopNavigation as DesktopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { TopNavigation as MobileNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { BlockedUserListItem } from './BlockedUserListItem'

export default function BlockedUsersPage() {
  const isMobile = useIsMobile()
  const TopNavigation = isMobile ? MobileNavigation : DesktopNavigation
  const { data: blockedUsers } = useBlockedUsers()

  return (
    <Stack>
      <TopNavigation position="sticky" sx={isMobile ? { borderBottomWidth: 0 } : undefined}>
        차단한 사용자
      </TopNavigation>
      <ContentContainer paddingY={isMobile ? 0 : 2}>
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
      </ContentContainer>
    </Stack>
  )
}
