import { MaterialIcons } from '@expo/vector-icons'
import { useTripMembers } from '@waylog/domains/trip-member'
import { Suspense } from 'react'
import { ListItem } from '../../../shared/components/ListItem'
import { Skeleton, Stack, Typography } from '../../../shared/components/mui'
import { TripInviteButton } from '../components/TripInviteButton'
import { MemberAvatar } from './MemberAvatar'

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
  // 호스트를 앞으로 보낸다.
  const orderedMembers = members.toSorted((a) => (a.isHost ? -1 : 0))

  return (
    <Stack gap={1} sx={{ width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" color="text.secondary">
          인원 ({members.length}명)
        </Typography>
        <TripInviteButton tripId={tripId}>초대</TripInviteButton>
      </Stack>

      <Stack gap={1} sx={{ width: '100%' }}>
        {orderedMembers.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ paddingVertical: 16, textAlign: 'center' }}
          >
            초대 링크로 멤버를 추가해보세요
          </Typography>
        ) : (
          orderedMembers.map((member) => (
            <ListItem key={member.id} leftAddon={<MemberAvatar member={member} size={28} />}>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <Typography variant="body2">{member.name || '(이름 없음)'}</Typography>
                {member.isHost && (
                  <>
                    <MaterialIcons name="workspace-premium" size={14} color="#4C84FF" />
                    <Typography variant="caption" color="text.secondary">
                      호스트
                    </Typography>
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
    <Stack gap={1} sx={{ width: '100%' }}>
      {Array.from({ length: 2 }).map((_, key) => (
        <ListItem key={key}>
          <Skeleton />
        </ListItem>
      ))}
    </Stack>
  )
}
