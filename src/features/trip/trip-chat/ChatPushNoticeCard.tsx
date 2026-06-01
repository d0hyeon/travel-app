import { Button } from "@mui/material";
import { useState, type ComponentProps } from "react";
import { useWebPushSubscription } from "~features/auth/useWebPushSubscription";
import { NotificationCard } from "~shared/components/notification-card/NotificationCard";
import { SlideReveal } from "~shared/components/slide-reveal/SlideReveal";
import { useLoading } from "~shared/hooks/useLoading";


export function ChatPushNoticeCard(props: ComponentProps<typeof NotificationCard>) {
  const webPush = useWebPushSubscription();
  const [isLoading, startTransition] = useLoading();
  const [open, setOpen] = useState(true);

  if (webPush.isSubscribed) {
    return null;
  }

  return (
    <SlideReveal open={open} delay={1000}>
      <NotificationCard onClose={() => setOpen(false)} {...props}>
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
    </SlideReveal>
  );
}