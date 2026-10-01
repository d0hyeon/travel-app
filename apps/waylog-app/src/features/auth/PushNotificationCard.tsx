import { useLoading } from '@waylog/react'
import { useState } from 'react'
import { Linking, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { SlideReveal } from '../../shared/components/animation/SlideReveal'
import { NotificationCard } from '../../shared/components/notification-card/NotificationCard'
import { Button } from '~/shared/components/design-system'
import { useNativePushSubscription } from './useNativePushSubscription'

interface Props {
  style?: StyleProp<ViewStyle>
}

export function PushNotificationCard({ style }: Props) {
  const push = useNativePushSubscription()
  const [isLoading, startTransition] = useLoading()
  const [isOpen, setIsOpen] = useState(true)

  if (push.isSubscribed) return null

  return (
    <SlideReveal open={isOpen} delay={1000} duration={200}>
      <View style={styles.revealContent}>
        <NotificationCard variant="outline" onClose={() => setIsOpen(false)} style={[styles.card, style]}>
          <NotificationCard.Title textAlign="center">
            실시간으로 알림을 받아보세요
          </NotificationCard.Title>
          {push.isEnabled && push.permissionStatus !== 'denied' ? (
            <Button
              variant="contained"
              disabled={isLoading}
              fullWidth
              style={styles.button}
              onPress={() => {
                startTransition(async () => {
                  if (!push.hasPermission) {
                    const isGranted = await push.requestPermission()
                    if (!isGranted) return
                  }
                  await push.subscribe()
                })
              }}
            >
              알림 받기
            </Button>
          ) : (
            <>
              <NotificationCard.Text textAlign="center">
                {push.permissionStatus === 'denied'
                  ? '설정에서 알림을 켤 수 있어요.'
                  : '푸시 알림은 실기기에서만 사용할 수 있어요.'}
              </NotificationCard.Text>
              {push.permissionStatus === 'denied' && (
                <Button variant="outlined" fullWidth style={styles.button} onPress={() => void Linking.openSettings()}>
                  설정 열기
                </Button>
              )}
            </>
          )}
        </NotificationCard>
      </View>
    </SlideReveal>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 0, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  revealContent: { paddingHorizontal: 16, paddingVertical: 12, },
  button: { borderRadius: 20 },
})
