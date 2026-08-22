import { Button, Stack, Typography } from "@mui/material";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";
import { AuthStateSync, useAuth } from "@waylog/domains/clients";
import { getActivedChatTripId } from "~features/trip/trip-chat/notification/useChatActivation";
import { useChatWebPushFallback as useChatBrowserPushFallback } from '~features/trip/trip-chat/notification/useChatWebPushFallback';
import { useTripChatOverlay } from "~features/trip/trip-chat/useTripChatOverlay";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { BFCacheListener } from "~shared/hooks/dom/useIsBFCacheRestored";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useSkipBackNavigationTransition } from "~shared/hooks/interaction/useSkipBackNavigationTransition";

export function AppInitializer() {
  const confirm = useConfirmDialog();
  const isMobile = useIsMobile();

  useEffect(() => {
    const updateSW = registerSW({
      // immediate: true,
      async onNeedRefresh() {
        const isConfirm = await confirm('새로운 버전이 출시되었어요.\n업데이트를 진행할게요');
        if (isConfirm) updateSW(true);
      },
    })
  }, []);

  useSkipBackNavigationTransition({ enabled: isMobile });

  const { data: auth } = useAuth({ required: false });

  return (
    <>
      <AuthStateSync />
      <BFCacheListener />
      {auth != null && (
        <Suspense>
          <InWebPushGlobalRenderer />
        </Suspense>
      )}
    </>
  )
}

function InWebPushGlobalRenderer() {
  const { open } = useTripChatOverlay();
  const isMobile = useIsMobile();

  useChatBrowserPushFallback(({ tripId, userName, content }) => {
    const isInChat = getActivedChatTripId() === tripId;

    if (isInChat) return;
    toast.message(<Message userName={userName} content={content} />, {
      position: isMobile ? 'top-center' : 'top-right',
      action: <Button variant='text' size={isMobile ? 'medium' : 'small'} onClick={() => open(tripId)} sx={{ justifySelf: 'end', alignSelf: 'end' }}>답장</Button>
    })
  })

  return null;
}

function Message({ content, userName }: { userName: string; content: string }) {
  return (
    <Stack direction="row" gap={1}>
      <Typography variant="body2" fontWeight={700} whiteSpace="nowrap">{userName}</Typography>
      <Typography variant="caption" >{content}</Typography>
    </Stack>
  )
}
