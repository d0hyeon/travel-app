import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { IconButton, Stack, Typography, type StackProps } from "@mui/material";
import { ListItem } from "~shared/components/ListItem";
import { useConfirmDialog } from "~shared/modules/confirm-dialog/useConfirmDialog";
import { useTripMemo } from "./useTripMemo";

interface Props extends StackProps {
  tripId: string;
}

export function TripMemo({ tripId, ...props }: Props) {
  const { data: { memos } } = useTripMemo(tripId);

  return (
    <Stack gap={1} {...props}>
      {memos.length > 0
        ? memos.map((memo) => (
            <TripMemo.Item key={memo.id} tripId={tripId} id={memo.id} />
          ))
        : (
            <Typography variant="body2" color="textSecondary" paddingY={3}>
              메모가 없어요
            </Typography>
          )}
    </Stack>
  );
}

interface ItemProps {
  tripId: string;
  id: string;
}

TripMemo.Item = ({ tripId, id }: ItemProps) => {
  const { data: { memos }, togglePin, remove } = useTripMemo(tripId);
  const confirm = useConfirmDialog();

  const memo = memos.find((m) => m.id === id);
  if (!memo) return null;

  const handleDelete = async () => {
    if (await confirm('이 메모를 삭제하시겠습니까?')) {
      await remove(id);
    }
  };

  return (
    <ListItem
      sx={{
        boxShadow: '1px 2px 6px #ddd',
        borderColor: memo.isPinned ? 'primary.main' : undefined,
        borderWidth: memo.isPinned ? 2 : 1,
      }}
      rightAddon={
        <Stack direction="row">
          <IconButton
            size="small"
            onClick={() => togglePin(id)}
            color={memo.isPinned ? 'primary' : 'default'}
          >
            {memo.isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
          </IconButton>
          <IconButton size="small" onClick={handleDelete} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      }
    >
      <Typography
        variant="body2"
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {memo.content}
      </Typography>
    </ListItem>
  );
};
