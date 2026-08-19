import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import { useTransition } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router';
import { AppRoute } from '~app/routes';
import { TripMemoForm } from './TripMemoForm';
import { useTripMemo } from './useTripMemo';
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile';

export default function TripMemoEditPage() {
  const { tripId, memoId } = useParams<{ tripId: string; memoId: string }>();
  const navigate = useNavigate();
  const { data: { memos }, update } = useTripMemo(tripId!);
  const [isPending, startTransition] = useTransition();

  const memo = memos.find((m) => m.id === memoId);
  const formId = 'memo-edit-form';

  if (!memo) {
    return (
      <Stack height="100%" alignItems="center" justifyContent="center">
        <Typography color="text.secondary">메모를 찾을 수 없어요</Typography>
      </Stack>
    );
  }

  return (
    <Stack height="100%">
      <TopNavigation position="relative">
        {memo.title}
      </TopNavigation>

      <Stack flex={1} overflow="auto" px={2} py={2} pb={10}>
        <TripMemoForm
          id={formId}
          defaultValues={{ title: memo.title ?? '', content: memo.content }}
          onSubmit={({ title, content }) => {
            startTransition(async () => {
              await update({ id: memoId!, title: title || null, content });
              navigate(-1);
            });
          }}
        />
      </Stack>

      <Stack
        position="sticky"
        bottom={0}
        px={2}
        py={1.5}
        bgcolor="background.paper"
        borderTop="1px solid"
        borderColor="divider"
      >
        <Button
          type="submit"
          form={formId}
          variant="contained"
          size="large"
          fullWidth
          disabled={isPending}
        >
          저장
        </Button>
      </Stack>
    </Stack>
  );
}
