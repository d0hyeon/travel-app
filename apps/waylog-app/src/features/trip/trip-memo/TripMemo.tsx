import { MaterialIcons } from '@expo/vector-icons';
import { Box, Button, Fab, Skeleton, Stack, Typography } from '~/shared/components/design-system';
import { Suspense, useRef } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Pressable } from 'react-native';
import { useOverlay } from '../../../shared/hooks/useOverlay';
import { useTripMemo } from '@waylog/domains/modules/trip-memo';
import type { TripMemo as TripMemoType } from '@waylog/domains/modules/trip-memo';
import { TripMemoForm, type TripMemoFormRef } from './TripMemoForm';
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet';
import { formatDate } from 'date-fns';
import { getMemoDisplayTitle } from './memoTitle';

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
    overlay.open(({ isOpen, close }) => (
      <TripMemoFormSheet
        isOpen={isOpen}
        onClose={close}
        onSubmit={async ({ title, content }) => {
          await add({ title: title || null, content });
          close();
        }}
      />
    ));
  };

  return (
    <Stack style={styles.container}>
      <Box style={styles.content}>
        {memos.length === 0 ? (
          <Typography variant="body2" color="text.secondary" style={styles.emptyMessage}>
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
        onPress={handleAdd}
        style={styles.addButton}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
      </Fab>
    </Stack>
  );
}

interface TripMemoFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: { title: string | null; content: string }) => Promise<void>;
}

function TripMemoFormSheet({ isOpen, onClose, onSubmit }: TripMemoFormSheetProps) {
  const formRef = useRef<TripMemoFormRef>(null);

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} safeArea>
      <BottomSheet.Header>새 메모</BottomSheet.Header>
      <BottomSheet.Body style={styles.formBody}>
        <TripMemoForm ref={formRef} onSubmit={onSubmit} />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button onPress={onClose} variant="outlined" fullWidth>취소</Button>
        <Button onPress={() => formRef.current?.submit()} variant="contained" fullWidth>저장</Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  );
}

const PREVIEW_MAX_LENGTH = 30;

interface MemoRowProps {
  tripId: string;
  memo: TripMemoType;
}

function MemoRow({ tripId, memo }: MemoRowProps) {
  const preview = memo.content.substring(0, PREVIEW_MAX_LENGTH);
  const displayTitle = getMemoDisplayTitle(memo.title, memo.content, PREVIEW_MAX_LENGTH);
  const trimmedTitle = memo.title?.trim() ?? '';
  const hasExplicitTitle = trimmedTitle.length > 0;
  const previewText = hasExplicitTitle ? preview : null;
  const date = formatDate(memo.createdAt, 'yyyy-MM-dd');
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/trip/${tripId}/memo/${memo.id}`)}>
      <Stack
        direction="row"
        alignItems="center"
        style={styles.memoRow}
      >
        <Stack gap={0.5} style={styles.memoText}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            {memo.isPinned && <MaterialIcons name="push-pin" size={12} color="#4C84FF" />}
            <Typography variant="body2" numberOfLines={1}>
              {displayTitle}
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
        <Stack key={i} gap={0.5} style={styles.memoRow}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" />
        </Stack>
      ))}
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: { height: '100%', position: 'relative' },
  content: { flex: 1 },
  emptyMessage: { textAlign: 'center', paddingVertical: 48 },
  addButton: { position: 'absolute', bottom: 16, right: 16 },
  formBody: { paddingHorizontal: 16 },
  memoRow: { paddingHorizontal: 16, paddingVertical: 12 },
  memoText: { flex: 1, minWidth: 0 },
})
