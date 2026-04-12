import DeleteIcon from '@mui/icons-material/Delete'
import { Avatar, Card, CardContent, CardHeader, IconButton, Skeleton, Stack, Typography } from "@mui/material"
import { Suspense } from 'react'
import { ListItem } from '../../../shared/components/ListItem'
import { TripInviteButton } from '../components/TripInviteButton'
import { useTripMembers } from './useTripMembers'

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
    <Card variant="outlined">
      <Stack direction="row" alignItems="center" justifyContent="space-between" paddingRight={2}>
        <CardHeader title={`참여 인원 (${members.length}명)`} />
        <TripInviteButton tripId={tripId}>초대</TripInviteButton>
      </Stack>
      <CardContent>
        <Stack spacing={1}>
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
                    sx={{ width: 44, height: 44, fontSize: 18 }}
                  >
                    {member.name?.[0] ?? '?'}
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
      </CardContent>
    </Card>
  )
}

function Pending() {
  return (
    <Card variant="outlined">
      <CardHeader title="참여 인원" />
      <CardContent>
        <Stack spacing={1}>
          {Array.from({ length: 2 }).map((_, key) => (
            <ListItem
              key={key}
              leftAddon={<Skeleton variant="circular" width={44} height={44} />}
              rightAddon={
                <IconButton size="small" color="error" disabled>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <Skeleton variant="text" width={80} />
            </ListItem>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
