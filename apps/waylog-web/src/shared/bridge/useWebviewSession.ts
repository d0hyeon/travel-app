import { supabase } from '@waylog/domains/clients'
import { useEffect, useState } from 'react'
import { bridgeClient } from './bridgeClient'

type WebviewSessionState = 'checking' | 'native' | 'browser'

export function useWebviewSession(): WebviewSessionState {
  const [state, setState] = useState<WebviewSessionState>('checking')

  useEffect(() => {
    let cancelled = false

    bridgeClient
      .ready()
      .then(async () => {
        const { accessToken, refreshToken } = await bridgeClient.getAuthTokens({})
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (error) throw error
        if (!cancelled) setState('native')
      })
      .catch(() => {
        if (!cancelled) setState('browser')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
