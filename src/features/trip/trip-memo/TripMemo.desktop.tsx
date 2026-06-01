import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { Box, Button, Dialog, DialogActions, DialogContent, IconButton, Skeleton, Stack, TextField, Typography, type DialogProps, type StackProps } from "@mui/material";
import { ListItem } from "~shared/components/ListItem";
import { PopMenu } from "~shared/components/PopMenu";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { useTripMemo } from "./useTripMemo";
import { generatePath, Link } from 'react-router';
import { AppRoute } from '~app/routes';
import type { TripMemo } from './tripMemo.type';
import { formatDate, set } from 'date-fns';
import { EditableText } from '~shared/components/EditableText';
import { useOverlay } from '~shared/hooks/useOverlay';
import { DialogTitle } from '~shared/components/confirm-dialog/DialogTitle';
import { useState } from 'react';

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

const PREVIEW_MAX_LENGTH = 100

TripMemo.Item = ({ tripId, id }: ItemProps) => {
  const { data: { memos }, togglePin, remove } = useTripMemo(tripId);
  const confirm = useConfirmDialog();

  const memo = memos.find((m) => m.id === id);
  if (!memo) return null;

  const preview = memo.content.substring(0, PREVIEW_MAX_LENGTH).replace(/\n/g, ' ');
  const title = memo.title ?? preview;
  const previewText = memo.title ? preview : null;

  const handleDelete = async () => {
    if (await confirm('이 메모를 삭제하시겠습니까?')) {
      await remove(id);
    }
  };
  const overlay = useOverlay();


  return (
    <ListItem.Button
      onClick={() => {
        overlay.open(({ isOpen, close }) => (
          <MemoEditorDialog memoId={memo.id} tripId={tripId} onClose={close} open={isOpen} />
        ))
      }}
      rightAddon={
        <span onClick={(e) => e.stopPropagation()}>
          <MemoMenu
            isPinned={memo.isPinned}
            onTogglePin={() => togglePin(id)}
            onDelete={handleDelete}
          />
        </span>
      }
      sx={{
        boxShadow: memo.isPinned ? '1px 2px 6px #ddd' : undefined,
        borderColor: memo.isPinned ? 'primary.main' : 'divider',
        borderWidth: 1,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {title}
      </Typography>
      {!!previewText && (
        <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'nowrap', wordBreak: 'break-word' }}>
          {previewText} {memo.content.length > PREVIEW_MAX_LENGTH && '...'}
        </Typography>
      )}
    </ListItem.Button>
  );
};

type EditorDialog = Omit<DialogProps, 'onClose'> & {
  tripId: string;
  memoId: string;
  onClose?: () => void;
}
function MemoEditorDialog({ memoId, tripId, ...props }: EditorDialog) {
  const { data: { memos }, update } = useTripMemo(tripId);

  const memo = memos.find((m) => m.id === memoId);
  if (!memo) return null;

  return (
    <Dialog {...props}>
      <EditableText
        value={memo.title ?? undefined}
        format={value => (
          <DialogTitle sx={{ paddingRight: 0 }}>
            {value == null || value === '' ? '메모' : value}
          </DialogTitle>
        )}
        renderEditField={props => (
          <Box paddingY={2} paddingLeft={3}>
            <EditableText.Field {...props} placeholder="제목을 입력하세요" />
          </Box>
        )}
        onSubmit={(value) => update({ id: memo.id, title: value === '' ? null : value })}
      />
      <DialogContent sx={{ paddingTop: 0 }}>
        <Stack gap={1}>
          <Box sx={{ width: '100%', minHeight: '140px', border: '1px solid', borderColor: 'divider', borderRadius: 2, padding: 2 }}>
            <EditableText
              value={memo.content}
              renderEditField={(props, control) => (
                <TextField
                  multiline
                  minRows={5}
                  placeholder="메모를 입력하세요"
                  sx={{
                    margin: -2,
                    width: 'calc(100% + 32px)',
                    '.MuiInputBase-root': { padding: 2 }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      if (event.metaKey || event.ctrlKey) {
                        return props.onChange(props.value + '\n');
                      }
                      control.submit();
                    }
                  }}
                  {...props}
                />
              )}
              width="100%"
              sx={{
                whiteSpace: 'pre-wrap',
                '.editable-text': { alignItems: 'start' },
                '.editable-text-end-icon': { mt: 0.5 }
              }}
              onSubmit={(value) => update({ id: memo.id, content: value })}
            />
          </Box>
          <Typography variant="caption" textAlign="right" >
            작성일 : {formatDate(memo.createdAt, 'yyyy-MM-dd')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={props.onClose}>
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  )
}

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
