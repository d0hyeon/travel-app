import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Avatar, IconButton, Skeleton, Stack, Typography } from "@mui/material"
import { Suspense } from 'react'
import { ListItem } from '~shared/components/ListItem'
import { PopMenu } from '~shared/components/PopMenu'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { useTripMembers } from '../trip-member/useTripMembers'

interface Props {
  tripId: string
}

export function TripMemberSection(props: Props) {
  return (
    <Suspense fallback={<Pending />}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ tripId }: Props) {
  const { data: members, remove } = useTripMembers(tripId)
  const confirm = useConfirmDialog()

  const handleDeleteMember = async (memberId: string) => {
    if (await confirm('이 인원을 삭제하시겠습니까?')) {
      remove(memberId)
    }
  }

  return (
    <Stack gap={1} width="100%">
      <Typography variant="subtitle2" color="text.secondary" sx={{ marginTop: -1 }}>
        인원 ({members.length}명)
      </Typography>

      <Stack spacing={1} width="100%">
        {members.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            초대 링크로 멤버를 추가해보세요
          </Typography>
        ) : (
          members.map((member) => (
            <ListItem
              key={member.id}
              leftAddon={
                <Avatar
                  src={member.user.avatarUrl ?? undefined}
                  sx={{ width: 28, height: 28, fontSize: 13 }}
                >
                  {member.user.name ?? '?'}
                </Avatar>
              }
              rightAddon={
                <PopMenu
                  items={(
                    <PopMenu.Item
                      onClick={() => handleDeleteMember(member.id)}
                      icon={<DeleteIcon fontSize="small" sx={{ mr: 1 }} />}
                      sx={{ color: 'error.main' }}
                    >
                      삭제
                    </PopMenu.Item>
                  )}
                />
              }
            >
              <Typography variant="body2">
                {member.user.name || '(이름 없음)'}
              </Typography>
            </ListItem>
          ))
        )}
      </Stack>
    </Stack>
  )
}

function Pending() {
  return (
    <Stack gap={1} width="100%">
      <Typography variant="subtitle2" color="text.secondary">
        인원
      </Typography>
      <Stack spacing={1} width="100%">
        <ListItem
          leftAddon={<Skeleton variant="circular" width={28} height={28} />}
          rightAddon={
            <IconButton size="small" disabled>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          }
        >
          <Skeleton variant='text' width={80} />
        </ListItem>
      </Stack>
    </Stack>
  )
}
