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

      // 로그인 시 user_profiles 생성/업데이트 (카카오 닉네임/프로필 이미지 반영)
      if (event === 'SIGNED_IN' && session?.user) {
        const meta = session.user.user_metadata
        const name = meta.nickname ?? meta.name ?? meta.full_name ?? ''
        const avatarUrl = meta.picture ?? meta.avatar_url ?? null

        await supabase
          .from('user_profiles')
          .upsert(
            { id: session.user.id, name, avatar_url: avatarUrl } as never,
            { onConflict: 'id' }
          )
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isLoading }
}
