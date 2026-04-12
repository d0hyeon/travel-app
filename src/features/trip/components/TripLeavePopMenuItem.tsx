import { useAuth } from "~features/auth/useAuth";
import { assert } from "~shared/utils/assert";
import { useTrip } from "../useTrip";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { useNavigate } from "react-router";
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
  const { data: auth } = useAuth();
  assert(!!auth, '로그인이 필요합니다.');

  const { data: { userId, name }, remove, leave } = useTrip(tripId)
  const isHost = auth.id === userId;

  const confirm = useConfirmDialog();
  const navigate = useNavigate();

  return (
    <PopMenu.Item
      icon={<LeaveIcon />}
      color="error"
      onClick={async () => {
        if (await confirm(`${name}을(를) 나가시겠어요?`)) {
          await (isHost ? remove.mutateAsync() : leave.mutateAsync());
          navigate('/', { replace: true })
        }
      }}
    >
      나가기
    </PopMenu.Item>
  )
}

