import { MaterialIcons } from '@expo/vector-icons';
import { Box, Button, Fab, Skeleton, Stack, Typography } from '../../../shared/components/mui';
import { Suspense, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useOverlay } from '../../../shared/hooks/useOverlay';
import { useTripMemo } from '@waylog/domains/modules/trip-memo';
import type { TripMemo as TripMemoType } from '@waylog/domains/modules/trip-memo';
import { TripMemoForm, type TripMemoFormRef } from './TripMemoForm';
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet';
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
      const formRef = { current: null as TripMemoFormRef | null };
      return (
        <BottomSheet isOpen={isOpen} onClose={close} safeArea>
          <BottomSheet.Header>새 메모</BottomSheet.Header>
          <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
            <TripMemoForm
              ref={(instance) => { formRef.current = instance }}
              onSubmit={async ({ title, content }) => {
                await add({ title: title || null, content });
                close();
              }}
            />
          </BottomSheet.Body>
          <BottomSheet.BottomActions>
            <Button onClick={close} variant="outlined" fullWidth>취소</Button>
            <Button onClick={() => formRef.current?.submit()} variant="contained" fullWidth>저장</Button>
          </BottomSheet.BottomActions>
        </BottomSheet>
      );
    });
  };

  return (
    <Stack sx={{ height: '100%', position: 'relative' }}>
      <Box sx={{ flex: 1 }}>
        {memos.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', paddingVertical: 48 }}>
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
        onClick={handleAdd}
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
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
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/trip/${tripId}/memo/${memo.id}`)}>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
      <Stack gap={0.5} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          {memo.isPinned && <MaterialIcons name="push-pin" size={12} color="#4C84FF" />}
          <Typography variant="body2" numberOfLines={1}>
            {title}
          </Typography>
        </Stack>
        <Stack direction="row" gap={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {date}
          </Typography>
          {previewText && (
            <Typography variant="caption" color="text.secondary" numberOfLines={1}>
              {previewText}{memo.content.length > PREVIEW_MAX_LENGTH ? '…' : ''}
            </Typography>
          )}
        </Stack>
      </Stack>
      </Stack>
    </Pressable>
  );
}

function MemoListSkeleton() {
  return (
    <Stack>
      {Array.from({ length: 4 }).map((_, i) => (
        <Stack key={i} gap={0.5} sx={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" />
        </Stack>
      ))}
    </Stack>
  );
}
