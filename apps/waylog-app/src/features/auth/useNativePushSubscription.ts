import { useAuth } from '@waylog/domains/auth'
import { useSuspenseQuery } from '@waylog/react'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { useCallback, useState } from 'react'
import { Platform } from 'react-native'
import {
  addPushSubscription,
  findPushSubscription,
  removePushSubscription,
} from './pushSubscription.api'

// 웹 useWebPushSubscription 과 같은 모양을 유지한다.
// ChatPushNoticeCard 같은 호출부가 양쪽에서 같은 코드여야 하기 때문이다.
const ANDROID_CHANNEL_ID = 'default'

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

  const isEnabled = Device.isDevice && projectId != null
  const [token, setToken] = useState<string | null>(null)

  const { data: registeredSubscription, refetch } = useSuspenseQuery({
    queryKey: ['push_subscriptions', currentUser.id, token],
    queryFn: () => {
      if (token == null) return null
      return findPushSubscription(currentUser.id, token)
    },
  })

  const isSubscribed = registeredSubscription != null

  const requestPermission = useCallback(async () => {
    const { status: existing } = await Notifications.getPermissionsAsync()
    if (existing === 'granted') return true

    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  }, [])

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
    setToken(nextToken)
    await refetch()
  }, [currentUser.id, isEnabled, projectId, refetch])

  const unsubscribe = useCallback(async () => {
    if (token == null) return

    await removePushSubscription(currentUser.id, token)
    setToken(null)
    await refetch()
  }, [currentUser.id, refetch, token])

  return {
    isEnabled,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
  }
}
