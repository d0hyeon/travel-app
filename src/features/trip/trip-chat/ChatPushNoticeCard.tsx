import { Box, Button } from "@mui/material";
import { useEffect, useRef, type ComponentProps } from "react";
import { useWebPushSubscription } from "~features/auth/useWebPushSubscription";
import { NotificationCard } from "~shared/components/notification-card/NotificationCard";
import { useAnimation } from "~shared/hooks/animation/useAnimation";
import { useElementSize } from "~shared/hooks/dom/useElementSize";
import { useLoading } from "~shared/hooks/useLoading";


export function ChatPushNoticeCard(props: ComponentProps<typeof NotificationCard>) {
  const webPush = useWebPushSubscription();

  const [size, calculate] = useElementSize({ once: true });
  const isPrepared = size != null;

  const containerRef = useRef<HTMLDivElement>(null);
  const animation = useAnimation({
    frames: isPrepared ? [
      { height: '0px', opacity: 0, offset: 0 },
      { height: `${size.height}px`, opacity: 0, transform: 'scale(0.9)', offset: 0.3 },
      { height: `${size.height}px`, opacity: 0, transform: 'scale(0.9)', offset: 0.6 },
      { height: `${size.height}px`, opacity: 1, transform: 'scale(1)', offset: 1 }
    ] : [],
    duration: 800,
    delay: 1000,
  }, containerRef.current)

  useEffect(() => {
    if (isPrepared) animation.play();
  }, [isPrepared]);

  const [isLoading, startTransition] = useLoading();
  if (webPush.isSubscribed) {
    return null;
  }

  return (
    <Box position="relative" overflow="hidden" height="0px" ref={containerRef}>
      <Box ref={calculate} position={size == null ? 'absolute' : 'relative'}>
        <NotificationCard
          onClose={() => animation.scrub(0)}
          {...props}
        >
          <NotificationCard.Title textAlign="center">
            {webPush.isEnabled ? '실시간으로 알림을 받아보세요' : '바로가기 앱을 추가해 보세요'}
          </NotificationCard.Title>
          {!webPush.isEnabled ? (
            <NotificationCard.Text textAlign="center">
              실시간 알림 설정을 할 수 있어요
            </NotificationCard.Text>
          ) : (
            <Button
              variant="contained"
              loading={isLoading}
              sx={{ borderRadius: '20px !important' }}
              onClick={() => {
                startTransition(async () => {
                  if (!webPush.hasPermission) {
                    const isGranted = await webPush.requestPermission();
                    if (!isGranted) return;
                  }
                  await webPush.subscribe();
                })
              }}
            >
              알림 받기
            </Button>
          )}

        </NotificationCard>
      </Box>
    </Box>
  )
}