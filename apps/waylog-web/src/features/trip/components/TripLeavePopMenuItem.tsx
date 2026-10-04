import { useTrip } from "@waylog/domains/modules/trip";
import { TripPermission, useTripPermission } from "@waylog/domains/modules/trip-member";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { useNavigate } from "react-router";
import { assert } from "@waylog/utility";
import { PopMenu } from "~shared/components/PopMenu";
import LeaveIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const {
    data: { name },
    remove: removeTrip,
    leave: leaveTrip
  } = useTrip(tripId)
  const permission = useTripPermission(tripId, [TripPermission.삭제, TripPermission.탈퇴])

  assert(permission[TripPermission.삭제] || permission[TripPermission.탈퇴], '권한이 없습니다.')

  const confirm = useConfirmDialog();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (await confirm(`${name} 여행을 삭제할까요? 모든 멤버의 여행에서도 사라져요.`)) {
      navigate('/', { replace: true })
      removeTrip()
    }
  }

  const handleLeave = async () => {
    if (await confirm(`${name}을(를) 나가시겠어요?`)) {
      navigate('/', { replace: true })
      leaveTrip()
    }
  }

  if (permission[TripPermission.삭제]) {
    return (
      <PopMenu.Item icon={<DeleteIcon />} color="error" onClick={handleDelete}>
        삭제
      </PopMenu.Item>
    )
  }
  if (permission[TripPermission.탈퇴]) {
    return (
      <PopMenu.Item icon={<LeaveIcon />} color="error" onClick={handleLeave}>
        나가기
      </PopMenu.Item>
    )
  }
}
