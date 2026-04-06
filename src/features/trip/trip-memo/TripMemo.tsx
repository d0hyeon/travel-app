import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { IconButton, Skeleton, Stack, Typography, type StackProps } from "@mui/material";
import { ListItem } from "~shared/components/ListItem";
import { PopMenu } from "~shared/components/PopMenu";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { useTripMemo } from "./useTripMemo";

interface Props extends StackProps {
  tripId: string;
}

export function TripMemo({ tripId, ...props }: Props) {
  const { data: { memos } } = useTripMemo(tripId);

  return (
    <Stack gap={1} {...props}>
      {memos.length > 0
        ? memos
          .toSorted((item) => item.isPinned ? -1 : 1)
          .map((memo) => (
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

TripMemo.Skeleton = (props: StackProps) => {
  return (
    <Stack gap={1} {...props}>
      {Array.from({ length: 2 }).map((_, key) => (
        <ListItem
          key={key}
          sx={{
            boxShadow: '1px 2px 6px #ddd',
            borderWidth: 1
          }}
          rightAddon={
            <IconButton size="small" disabled>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          }
        >
          <Skeleton variant="text" />
        </ListItem>
      ))}
    </Stack>
  )
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
        <MemoMenu
          isPinned={memo.isPinned}
          onTogglePin={() => togglePin(id)}
          onDelete={handleDelete}
        />
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

interface MemoMenuProps {
  isPinned: boolean
  onTogglePin: () => void
  onDelete: () => void
}

function MemoMenu({ isPinned, onTogglePin, onDelete }: MemoMenuProps) {
  return (
    <PopMenu
      items={[
        <PopMenu.Item onClick={onTogglePin} icon={isPinned ? <PushPinOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> : <PushPinIcon fontSize="small" sx={{ mr: 1 }} />}>
          {isPinned ? '고정 해제' : '고정'}
        </PopMenu.Item>,
        <PopMenu.Item onClick={onDelete} icon={<DeleteIcon fontSize="small" sx={{ mr: 1 }} />} sx={{ color: 'error.main' }}>
          삭제
        </PopMenu.Item>
      ]}
    />
  )
}
