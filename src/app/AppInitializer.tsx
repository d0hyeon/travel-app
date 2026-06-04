import { Button, Stack, Typography } from "@mui/material";
import { Suspense } from "react";
import { toast } from "sonner";
import { AuthStateSync, useAuth } from "~features/auth/useAuth";
import { getActivedChatTripId } from "~features/trip/trip-chat/notification/useChatActivation";
import { useChatWebPushFallback as useChatBrowserPushFallback } from '~features/trip/trip-chat/notification/useChatWebPushFallback';
import { useTripChatOverlay } from "~features/trip/trip-chat/useTripChatOverlay";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";

export function AppInitializer() {
  const { data: auth } = useAuth({ required: false });

  return (
    <>
      <AuthStateSync />
      {auth != null && (
        <Suspense>
          <InWebPush />
        </Suspense>
      )}
    </>
  )
}

function InWebPush() {
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
