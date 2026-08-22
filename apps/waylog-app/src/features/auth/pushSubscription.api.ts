import { supabase } from '@waylog/domains/client'
import type { DataRaw, Json } from '@waylog/domains/client'

// 웹은 브라우저 PushSubscription 을 통째로 저장하지만 앱은 Expo 토큰 하나다.
// 같은 테이블을 쓰되 endpoint 에 토큰을 넣어 서버가 보낼 경로를 판단하게 한다.
export async function addPushSubscription(userId: string, token: string) {
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: token,
      subscription: { type: 'expo', token } as Json,
    },
    { onConflict: 'user_id,endpoint' },
  )
  if (error) throw error
}

export async function removePushSubscription(userId: string, token: string) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', token)
  if (error) throw error
}

export async function findPushSubscription(
  userId: string,
  token: string,
): Promise<DataRaw<'push_subscriptions'> | null> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('endpoint', token)
    .maybeSingle()
  if (error) throw error
  return data
}
