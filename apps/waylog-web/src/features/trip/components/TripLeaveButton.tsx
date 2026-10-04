import { Button, type ButtonProps } from "@mui/material";
import { useTrip } from "@waylog/domains/modules/trip";
import { TripPermission, useTripPermission } from "@waylog/domains/modules/trip-member";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { useNavigate } from "react-router";
import { assert } from "@waylog/utility";

interface Props extends Omit<ButtonProps, 'children'> {
  tripId: string;
}
export function TripLeaveButton({ tripId, color = 'error', ...props }: Props) {
  const {
    data: { name },
    remove: removeTrip,
    leave: leaveTrip
  } = useTrip(tripId);
  const permission = useTripPermission(tripId, [TripPermission.삭제, TripPermission.탈퇴]);
  const isDeletable = permission[TripPermission.삭제];

  assert(isDeletable || permission[TripPermission.탈퇴], '여행을 삭제하거나 나갈 수 있는 멤버가 아닙니다.');

  const confirm = useConfirmDialog();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (await confirm(`${name} 여행을 삭제할까요? 모든 멤버의 여행에서도 사라져요.`)) {
      navigate('/', { replace: true });
      removeTrip();
    }
  };

  const handleLeave = async () => {
    if (await confirm(`여행을 나가시겠어요?`)) {
      navigate('/', { replace: true });
      leaveTrip();
    }
  };

  if (isDeletable) {
    return <Button {...props} color={color} onClick={handleDelete}>여행 삭제</Button>
  }
  return <Button {...props} color={color} onClick={handleLeave}>여행에서 나가기</Button>
}
