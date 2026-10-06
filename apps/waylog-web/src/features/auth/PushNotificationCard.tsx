import { useLoading } from '@waylog/react'
import { Button } from '@mui/material'
import { useState, type ComponentProps } from 'react'
import { SlideReveal } from '~shared/components/animation/SlideReveal'
import { NotificationCard } from '~shared/components/notification-card/NotificationCard'
import { useWebPushSubscription } from './useWebPushSubscription'

export function PushNotificationCard(props: ComponentProps<typeof NotificationCard>) {
  const webPush = useWebPushSubscription()
  const [isLoading, startTransition] = useLoading()
  const [isOpen, setIsOpen] = useState(true)

  if (webPush.isSubscribed) return null

  return (
    <SlideReveal open={isOpen} delay={1000}>
      <NotificationCard onClose={() => setIsOpen(false)} {...props}>
        <NotificationCard.Title textAlign="center">
          실시간으로 알림을 받아보세요
        </NotificationCard.Title>
        {webPush.isEnabled ? (
          <Button
            variant="contained"
            loading={isLoading}
            sx={{ borderRadius: '20px !important' }}
            onClick={() => {
              startTransition(async () => {
                if (!webPush.hasPermission) {
                  const isGranted = await webPush.requestPermission()
                  if (!isGranted) return
                }
                await webPush.subscribe()
              })
            }}
          >
            알림 받기
          </Button>
        ) : (
          <NotificationCard.Text textAlign="center">
            바로가기 앱을 설치하면 알람을 설정할 수 있어요.
          </NotificationCard.Text>
        )}
      </NotificationCard>
    </SlideReveal>
  )
}
