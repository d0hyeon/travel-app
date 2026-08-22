import { useLoading } from '@waylog/react'
import { useState } from 'react'
import { useNativePushSubscription } from '../../auth/useNativePushSubscription'
import { SlideReveal } from '../../../shared/components/animation/SlideReveal'
import { NotificationCard } from '../../../shared/components/notification-card/NotificationCard'
import { Button } from '../../../shared/components/mui'
import type { Sx } from '../../../shared/components/mui'

interface Props {
  sx?: Sx
}

// 웹 ChatPushNoticeCard 와 같은 동작이다.
// 웹은 웹푸시 구독을, 앱은 Expo 토큰 등록을 시킨다 — 훅 시그니처가 같아 본문이 같다.
export function ChatPushNoticeCard(props: Props) {
  const push = useNativePushSubscription()
  const [isLoading, startTransition] = useLoading()
  const [isOpen, setIsOpen] = useState(true)

  if (push.isSubscribed) {
    return null
  }

  return (
    <SlideReveal open={isOpen} delay={1000} duration={400}>
      <NotificationCard onClose={() => setIsOpen(false)} {...props}>
        <NotificationCard.Title textAlign="center">
          실시간으로 알림을 받아보세요
        </NotificationCard.Title>
        {push.isEnabled ? (
          <Button
            variant="contained"
            disabled={isLoading}
            sx={{ borderRadius: 20 }}
            onClick={() => {
              startTransition(async () => {
                const isGranted = await push.requestPermission()
                if (!isGranted) return

                await push.subscribe()
              })
            }}
          >
            알림 받기
          </Button>
        ) : (
          <NotificationCard.Text textAlign="center">
            설정에서 알림을 킬 수 있어요.
          </NotificationCard.Text>
        )}
      </NotificationCard>
    </SlideReveal>
  )
}
