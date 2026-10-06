import { Button, type ButtonProps } from "@mui/material";
import { useTrip } from "@waylog/domains/modules/trip";
import { useAuth } from "@waylog/domains/clients";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { useNavigate } from "react-router";

interface Props extends ButtonProps {
  tripId: string;
}
export function TripLeaveButton({ tripId, color = 'error', children = '나가기', ...props }: Props) {
  const { data: auth } = useAuth();
  const {
    data: { userId },
    remove: removeTrip,
    leave: leaveTrip
  } = useTrip(tripId);
  const isHost = auth.id === userId;

  const confirm = useConfirmDialog();
  const navigate = useNavigate();

  return (
    <Button
      {...props}
      color={color}
      onClick={async () => {
        if (await confirm(`여행을 나가시겠어요?`)) {
          navigate('/', { replace: true });
          if (isHost) removeTrip();
          else leaveTrip();
        }
      }}
    >
      {children}
    </Button>
  )
}