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
  const { data: auth } = useAuth();
  const { leave: leaveTrip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const isLeavable = useTripPermission(tripId, TripPermission.탈퇴);

  assert(isLeavable, '여행을 나갈 수 있는 멤버가 아닙니다.');

  const confirm = useConfirmDialog();
  const navigate = useNavigate();

  const isHost = getTripRole(members, auth.id) === 'host';
  const hostSuccessor = findHostSuccessor(members);

  const getConfirmMessage = () => {
    if (!isHost) return '여행을 나가시겠어요?';
    if (hostSuccessor == null) return '마지막 멤버예요. 나가면 여행이 삭제돼요. 여행에서 나가시겠어요?';
    return `나가면 ${hostSuccessor.name}님이 호스트가 돼요. 여행에서 나가시겠어요?`;
  };

  const handleLeave = async () => {
    if (await confirm(getConfirmMessage())) {
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
