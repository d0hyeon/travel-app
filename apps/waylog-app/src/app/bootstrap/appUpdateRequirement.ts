import { supabase } from '@waylog/domains/clients'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { isVersionBelow } from './appUpdateRequirement.utils'

export type RequiredAppUpdate = {
  storeUrl: string
}

type StorePlatform = 'ios' | 'android'

const POLICY_TIMEOUT_MS = 3000

export async function checkRequiredAppUpdate(): Promise<RequiredAppUpdate | null> {
  const currentVersion = Constants.expoConfig?.version
  if (currentVersion == null) return null
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null

  const policy = await fetchStorePolicy(Platform.OS)
  if (policy == null) return null

  return isVersionBelow(currentVersion, policy.minimum_version) ? { storeUrl: policy.store_url } : null
}

async function fetchStorePolicy(platform: StorePlatform) {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), POLICY_TIMEOUT_MS)
  try {
    const { data } = await supabase
      .from('app_version_policies')
      .select('minimum_version, store_url')
      .eq('platform', platform)
      .abortSignal(abortController.signal)
      .maybeSingle()
    return data
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
