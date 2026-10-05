import { Button, type ButtonProps } from "@mui/material";
import { useTrip } from "@waylog/domains/modules/trip";
import { findHostSuccessor, getTripRole, TripPermission, useTripMembers, useTripPermission } from "@waylog/domains/modules/trip-member";
import { useAuth } from "@waylog/domains/clients";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { useNavigate } from "react-router";
import { assert } from "@waylog/utility";
import { toast } from "sonner";

interface Props extends Omit<ButtonProps, 'children'> {
  tripId: string;
}
export function TripLeaveButton({ tripId, color = 'error', ...props }: Props) {
  const { leave: leaveTrip } = useTrip(tripId);
  const isLeavable = useTripPermission(tripId, TripPermission.탈퇴);

  assert(isLeavable, '권한이 없습니다.');

  const confirm = useConfirmDialog();
  const navigate = useNavigate();


  const handleLeave = async () => {
    if (await confirm("여행을 나가시겠어요?")) {
      navigate('/', { replace: true });
      try {
        await leaveTrip();
      } catch {
        toast.error('여행에서 나가지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    }
  };

  return <Button {...props} color={color} onClick={handleLeave}>여행에서 나가기</Button>
}
