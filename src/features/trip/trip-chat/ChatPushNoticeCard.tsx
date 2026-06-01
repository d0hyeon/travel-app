import { Box, Button } from "@mui/material";
import { useEffect, useRef, type ComponentProps } from "react";
import { useWebPushSubscription } from "~features/auth/useWebPushSubscription";
import { NotificationCard } from "~shared/components/notification-card/NotificationCard";
import { useAnimation } from "~shared/hooks/animation/useAnimation";
import { useElementSize } from "~shared/hooks/dom/useElementSize";
import { useLoading } from "~shared/hooks/useLoading";


export function ChatPushNoticeCard(props: ComponentProps<typeof NotificationCard>) {
  const { isSubscribed, hasPermission, subscribe, requestPermission } = useWebPushSubscription();

  const [size, calculate] = useElementSize({ once: true });
  const containerRef = useRef<HTMLDivElement>(null);
  const animation = useAnimation({
    frames: size == null ? [] : [
      { height: '0px', opacity: 0, offset: 0 },
      { height: `${size.height}px`, opacity: 0, transform: 'scale(0.9)', offset: 0.3 },
      { height: `${size.height}px`, opacity: 0, transform: 'scale(0.9)', offset: 0.6 },
      { height: `${size.height}px`, opacity: 1, transform: 'scale(1)', offset: 1 }
    ],
    duration: 800,
    delay: 1000,
  }, containerRef.current)

  useEffect(() => {
    if (isSubscribed || size == null) return;
    animation.play();
  }, [isSubscribed, size]);

  const [isLoading, startTransition] = useLoading();

  if (isSubscribed) {
    return null;
  }

  return (
    <Box position="relative" overflow="hidden" height="0px" ref={containerRef}>
      <Box ref={calculate} position={size == null ? 'absolute' : 'relative'}>
        <NotificationCard
          onClose={() => animation.scrub(0)}
          {...props}
        >
          <NotificationCard.Title textAlign="center">실시간으로 알림을 받아보세요</NotificationCard.Title>
          <Button
            variant="contained"
            loading={isLoading}
            sx={{ borderRadius: '20px !important' }}
            onClick={() => {
              startTransition(async () => {
                if (!hasPermission) {
                  const isGranted = await requestPermission();
                  if (!isGranted) return;
                }
                await subscribe();
              })
            }}
          >
            알림 받기
          </Button>
        </NotificationCard>
      </Box>
    </Box>
  )
}