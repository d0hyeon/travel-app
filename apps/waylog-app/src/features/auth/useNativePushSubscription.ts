import { useAuth } from '@waylog/domains/clients'
import { useSuspenseQuery } from '@waylog/react'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { useCallback } from 'react'
import { Platform } from 'react-native'
import { usePushPermission } from '~shared/hooks/usePushPermission'
import { queryClient } from '~shared/query-client'
import {
  addPushSubscription,
  findPushSubscription,
  removePushSubscription,
} from './pushSubscription.api'

// 웹 useWebPushSubscription 과 같은 모양을 유지한다.
// PushNotificationCard 가 양쪽에서 같은 책임으로 쓸 수 있어야 하기 때문이다.
const ANDROID_CHANNEL_ID = 'default'

const pushSubscriptionKey = (userId: string) => ['push_subscriptions', userId]

/**
 * 푸시 토큰은 실기기에서만 나온다. 시뮬레이터는 APNs·FCM 에 등록되지 않는다.
 * projectId 는 EAS 프로젝트에서 온다 — 없으면 토큰을 받을 수 없다.
 */
function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined
  )
}

export function useNativePushSubscription() {
  const { data: currentUser } = useAuth()
  const projectId = getProjectId()

  const permission = usePushPermission({ suspense: true })
  const isEnabled = Device.isDevice && projectId != null

  const { data: registeredSubscription } = useSuspenseQuery({
    queryKey: pushSubscriptionKey(currentUser.id),
    queryFn: async () => {
      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
      return findPushSubscription(currentUser.id, token)
    },
    enabled: isEnabled && permission.hasPermission,
  })

  const isSubscribed = registeredSubscription != null

  const subscribe = useCallback(async () => {
    if (!isEnabled) {
      throw new Error(
        Device.isDevice
          ? 'EAS projectId 가 없어 푸시 토큰을 받을 수 없습니다.'
          : '푸시 알림은 실기기에서만 동작합니다.',
      )
    }

    // 안드로이드는 채널이 있어야 알림이 뜬다.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: '알림',
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }

    const { data: nextToken } = await Notifications.getExpoPushTokenAsync({ projectId })

    await addPushSubscription(currentUser.id, nextToken)
    await queryClient.invalidateQueries({ queryKey: pushSubscriptionKey(currentUser.id) })
  }, [currentUser.id, isEnabled, projectId])

  const unsubscribe = useCallback(async () => {
    if (!isEnabled) return

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    await removePushSubscription(currentUser.id, token)
    await queryClient.invalidateQueries({ queryKey: pushSubscriptionKey(currentUser.id) })
  }, [currentUser.id, isEnabled, projectId])

  return {
    isEnabled,
    isSubscribed,
    hasPermission: permission.hasPermission,
    permissionStatus: permission.status,
    requestPermission: permission.requestPermission,
    subscribe,
    unsubscribe,
  }
}
