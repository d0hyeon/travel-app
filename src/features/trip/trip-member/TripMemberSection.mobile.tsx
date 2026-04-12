import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Avatar, IconButton, Skeleton, Stack, Typography } from "@mui/material"
import { Suspense } from 'react'
import { ListItem } from '~shared/components/ListItem'
import { useTripMembers } from '../trip-member/useTripMembers'
import { TripInviteButton } from '../TripInviteButton'

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
  const { data: members } = useTripMembers(tripId)

  return (
    <Stack gap={1} width="100%">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" color="text.secondary" sx={{ marginTop: -1 }}>
          인원 ({members.length}명)
        </Typography>
        <TripInviteButton tripId={tripId}>초대</TripInviteButton>
      </Stack>
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
                  src={member.profileUrl ?? undefined}
                  sx={{ width: 28, height: 28, fontSize: 13 }}
                >
                  {member.name ?? '?'}
                </Avatar>
              }
            >
              <Typography variant="body2">
                {member.name || '(이름 없음)'}
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
