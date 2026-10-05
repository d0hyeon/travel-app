import { useTrip } from "@waylog/domains/modules/trip";
import { findHostSuccessor, getTripRole, TripPermission, useTripMembers, useTripPermission } from "@waylog/domains/modules/trip-member";
import { useAuth } from "@waylog/domains/clients";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { useNavigate } from "react-router";
import { assert } from "@waylog/utility";
import { toast } from "sonner";
import { PopMenu } from "~shared/components/PopMenu";
import LeaveIcon from '@mui/icons-material/Logout';
import { Suspense } from "react";

interface ItemProps {
  tripId: string;
}
export function TripLeavePopMenuItem(props: ItemProps) {
  return (
    <Suspense fallback={(
      <PopMenu.Item icon={<LeaveIcon />} color="error">
        나가기
      </PopMenu.Item>
    )}>
      <Resolved {...props} />
    </Suspense>
  )
}
function Resolved({ tripId }: ItemProps) {
  const { data: auth } = useAuth()
  const {
    data: { name },
    leave: leaveTrip
  } = useTrip(tripId)
  const { data: members } = useTripMembers(tripId)
  const isLeavable = useTripPermission(tripId, TripPermission.탈퇴)

  assert(isLeavable, '여행을 나갈 수 있는 멤버가 아닙니다.')

  const confirm = useConfirmDialog();
  const navigate = useNavigate();

  const isHost = getTripRole(members, auth.id) === 'host'
  const hostSuccessor = findHostSuccessor(members)

  const getConfirmMessage = () => {
    if (!isHost) return `${name}을(를) 나가시겠어요?`
    if (hostSuccessor == null) return '마지막 멤버예요. 나가면 여행이 삭제돼요. 여행에서 나가시겠어요?'
    return `나가면 ${hostSuccessor.name}님이 호스트가 돼요. 여행에서 나가시겠어요?`
  }

  const handleLeave = async () => {
    if (await confirm(getConfirmMessage())) {
      navigate('/', { replace: true })
      try {
        await leaveTrip()
      } catch {
        toast.error('여행에서 나가지 못했어요. 잠시 후 다시 시도해 주세요.')
      }
    }
  }

  return (
    <PopMenu.Item icon={<LeaveIcon />} color="error" onClick={handleLeave}>
      나가기
    </PopMenu.Item>
  )
}
