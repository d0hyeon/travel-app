import { Avatar, Button, ListItem, ListItemAvatar, ListItemText } from '@mui/material'
import { useUnblockUser } from '@waylog/domains/modules/user-block'
import type { UserProfile } from '@waylog/domains/modules/user-profile'
import { toast } from 'sonner'

interface Props {
  user: UserProfile
}

export function BlockedUserListItem({ user }: Props) {
  const unblockUser = useUnblockUser()

  return (
    <ListItem
      secondaryAction={
        <Button
          size="small"
          variant="outlined"
          loading={unblockUser.isPending}
          onClick={async () => {
            await unblockUser(user.id)
            toast.success('차단을 해제했어요')
          }}
        >
          차단 해제
        </Button>
      }
    >
      <ListItemAvatar>
        <Avatar src={user.profileUrl ?? undefined}>{user.name?.[0] ?? '?'}</Avatar>
      </ListItemAvatar>
      <ListItemText primary={user.name} />
    </ListItem>
  )
}
