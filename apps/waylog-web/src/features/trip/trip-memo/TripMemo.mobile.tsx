import AddIcon from '@mui/icons-material/Add';
import PushPinIcon from '@mui/icons-material/PushPin';
import { Box, Fab, Skeleton, Stack, Typography, Button } from '@mui/material';
import { Suspense } from 'react';
import { generatePath, Link } from 'react-router';
import { AppRoute } from '~app/routes';
import { useOverlay } from '~shared/hooks/useOverlay';
import { useTripMemo } from '@waylog/domains/modules/trip-memo';
import type { TripMemo as TripMemoType } from '@waylog/domains/modules/trip-memo';
import { TripMemoForm } from './TripMemoForm';
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet';
import { formatDate } from 'date-fns';

interface Props {
  tripId: string;
}

export function TripMemo(props: Props) {
  return (
    <Suspense fallback={<MemoListSkeleton />}>
      <Resolved {...props} />
    </Suspense>
  );
}

function Resolved({ tripId }: Props) {
  const { data: { memos }, add } = useTripMemo(tripId);
  const overlay = useOverlay();

  const handleAdd = () => {
    overlay.open(({ isOpen, close }) => {
      const formId = 'new-memo-form';
      return (
        <BottomSheet isOpen={isOpen} onClose={close}>
          <BottomSheet.Header>새 메모</BottomSheet.Header>
          <BottomSheet.Body>
            <TripMemoForm
              id={formId}
              onSubmit={async ({ title, content }) => {
                await add({ title: title || null, content });
                close();
              }}
            />
          </BottomSheet.Body>
          <BottomSheet.BottomActions>
            <Button onClick={close} variant="outlined" fullWidth>취소</Button>
            <Button type="submit" form={formId} variant="contained" fullWidth>저장</Button>
          </BottomSheet.BottomActions>
        </BottomSheet>
      );
    });
  };

  return (
    <Stack height="100%" position="relative">
      <Box
        flex={1}
        overflow="auto"
        sx={{
          '& > a + a': { borderTop: '1px solid', borderColor: 'divider' },
        }}
      >
        {memos.length === 0 ? (
          <Typography variant="body2" color="textSecondary" textAlign="center" py={6}>
            메모가 없어요
          </Typography>
        ) : memos
            .toSorted((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1))
            .map((memo) => (
              <MemoRow key={memo.id} tripId={tripId} memo={memo} />
            ))
        }
      </Box>

      <Fab
        color="primary"
        size="medium"
        aria-label="메모 추가"
        onClick={handleAdd}
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
      >
        <AddIcon />
      </Fab>
    </Stack>
  );
}

const PREVIEW_MAX_LENGTH = 30;

interface MemoRowProps {
  tripId: string;
  memo: TripMemoType;
}

function MemoRow({ tripId, memo }: MemoRowProps) {
  const preview = memo.content.substring(0, PREVIEW_MAX_LENGTH);
  const title = memo.title ?? preview;
  const previewText = memo.title ? preview : null;
  const date = formatDate(memo.createdAt, 'yyyy-MM-dd');
  const to = generatePath(AppRoute.여행_메모_상세, { tripId, memoId: memo.id });

  return (
    <Stack
      component={Link}
      to={to}
      direction="row"
      alignItems="center"
      px={2}
      py={1.5}
      sx={{
        textDecoration: 'none',
        color: 'inherit',
        '&:active': { bgcolor: 'action.selected' },
      }}
    >
      <Stack flex={1} gap={0.5} minWidth={0}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          {memo.isPinned && <PushPinIcon sx={{ fontSize: 12, color: 'primary.main', flexShrink: 0 }} />}
          <Typography variant="body2" fontWeight={600} noWrap>
            {title}
          </Typography>
        </Stack>
        <Stack direction="row" gap={1} alignItems="baseline">
          <Typography variant="caption" color="text.secondary" flexShrink={0}>
            {date}
          </Typography>
          {previewText && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {previewText}{memo.content.length > PREVIEW_MAX_LENGTH ? '…' : ''}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

function MemoListSkeleton() {
  return (
    <Stack>
      {Array.from({ length: 4 }).map((_, i) => (
        <Stack key={i} px={2} py={1.5} gap={0.5}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" />
        </Stack>
      ))}
    </Stack>
  );
}
