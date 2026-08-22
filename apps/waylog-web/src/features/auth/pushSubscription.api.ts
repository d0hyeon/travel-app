import { supabase } from '@waylog/domains/client'
import type { DataRaw, Json } from '@waylog/domains/client'

// 웹 표준 PushSubscription 타입에 의존한다. RN 푸시는 토큰 기반이라 형태가 다르므로
// 공유 패키지로 옮기지 않는다.
export async function addPushSubscription(userId: string, subscription: PushSubscription) {
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    subscription: subscription.toJSON() as Json,
  }, { onConflict: 'user_id,endpoint' })
  if (error) throw error
}

export async function removePushSubscription(userId: string, endpoint: string) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
  if (error) throw error
}

export async function findPushSubscription(userId: string, endpoint: string): Promise<DataRaw<'push_subscriptions'> | null> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .maybeSingle()
  if (error) throw error
  return data
}