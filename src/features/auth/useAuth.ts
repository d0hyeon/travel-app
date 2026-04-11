import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '~api/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      // 신규 로그인 시 user_profiles 생성 (트리거 대신 앱에서 처리)
      if (event === 'SIGNED_IN' && session?.user) {
        await supabase
          .from('user_profiles')
          .upsert({ id: session.user.id }, { onConflict: 'id', ignoreDuplicates: true } as never)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isLoading }
}
