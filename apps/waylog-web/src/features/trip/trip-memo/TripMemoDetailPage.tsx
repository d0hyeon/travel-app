import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { Skeleton, Stack, Typography } from '@mui/material';
import { formatDate } from 'date-fns';
import { Suspense } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router';
import { AppRoute } from '~app/routes';
import { OgPreviewCard } from '~features/open-graph/OgPreviewCard';
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog';
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile';
import { PopMenu } from '~shared/components/PopMenu';
import { extractUrls, renderTextWithLinks } from '~shared/utils/urls';
import { useTripMemo } from '@waylog/domains/trip-memo';

export default function TripMemoDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Resolved />
    </Suspense>
  );
}

function Resolved() {
  const { tripId, memoId } = useParams<{ tripId: string; memoId: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const { data: { memos }, togglePin, remove } = useTripMemo(tripId!);

  const memo = memos.find((m) => m.id === memoId);


  if (!memo) {
    return (
      <Stack height="100%" alignItems="center" justifyContent="center">
        <Typography color="text.secondary">메모를 찾을 수 없어요</Typography>
      </Stack>
    );
  }

  const urls = extractUrls(memo.content);


  return (
    <Stack height="100%">
      {/* 상단 바 */}
      <TopNavigation
        position="sticky"
        rightElement={
          <PopMenu
            items={[
              <PopMenu.Item
                icon={memo.isPinned ? <PushPinOutlinedIcon fontSize="small" /> : <PushPinIcon fontSize="small" />}
                onClick={() => togglePin(memo.id)}
              >
                {memo.isPinned ? '고정 해제' : '고정'}
              </PopMenu.Item>,
              <PopMenu.Item
                icon={<EditIcon fontSize="small" />}
                onClick={() => navigate(generatePath(AppRoute.여행_메모_편집, { tripId: tripId!, memoId: memoId! }))}
              >
                수정
              </PopMenu.Item>,
              <PopMenu.Item
                icon={<DeleteIcon fontSize="small" />}
                color="error"
                onClick={async () => {
                  if (await confirm('이 메모를 삭제하시겠습니까?')) {
                    remove(memoId!);
                    navigate(-1);
                  }
                }}
              >
                삭제
              </PopMenu.Item>,
            ]}
          />
        }
      >
        {memo.title}
      </TopNavigation>
      {/* 본문 */}
      <Stack flex={1} overflow="auto" px={2.5} py={2} gap={1}>
        <Typography variant="caption" color="text.secondary">
          {formatDate(memo.createdAt, 'yyyy년 M월 d일 a h:mm', { locale: undefined })}

        </Typography>
        <Typography
          variant="body1"
          color={memo.title ? 'text.secondary' : 'text.primary'}
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {renderTextWithLinks(memo.content)}
        </Typography>
        {urls.length > 0 && (
          <OgPreviewCard url={urls[0]} sx={{ mt: 1 }} />
        )}
      </Stack>
    </Stack>
  );
}

function DetailSkeleton() {
  return (
    <Stack height="100%">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={1}
        py={0.5}
        borderBottom="1px solid"
        borderColor="divider"
      >
        <Skeleton variant="circular" width={40} height={40} />
        <Stack direction="row" gap={1}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </Stack>
      </Stack>
      <Stack px={2.5} py={2} gap={1}>
        <Skeleton variant="text" width={120} />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="60%" />
      </Stack>
    </Stack>
  );
}
