import MoreVertIcon from '@mui/icons-material/MoreVert'
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'
import { IconButton, Skeleton, Stack, Typography } from "@mui/material"
import { Suspense } from 'react'
import { ListItem } from '~shared/components/ListItem'
import { useTripMembers } from '../trip-member/useTripMembers'
import { TripInviteButton } from '../components/TripInviteButton'
import { MemberAvatar } from './MemberAvatar'
import { SortCommand } from '~shared/utils/sorts'

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
  const orderedMembers = members.toSorted((a) => a.isHost ? SortCommand.Shift : SortCommand.Maintain)

  return (
    <Stack gap={1} width="100%">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" color="text.secondary" sx={{ marginTop: -1 }}>
          인원 ({members.length}명)
        </Typography>
        <TripInviteButton tripId={tripId}>초대</TripInviteButton>
      </Stack>
      <Stack spacing={1} width="100%">
        {orderedMembers.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            초대 링크로 멤버를 추가해보세요
          </Typography>
        ) : (
          orderedMembers.map((member) => (
            <ListItem
              key={member.id}
              leftAddon={<MemberAvatar member={member} size={28} />}
            >
              <Stack direction="row" alignItems="center" gap={0.5}>
                <Typography variant="body2">
                  {member.name || '(이름 없음)'}
                </Typography>
                {member.isHost && (
                  <>
                    <WorkspacePremiumIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                    <Typography variant="caption" color="text.secondary">호스트</Typography>
                  </>
                )}
              </Stack>
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
