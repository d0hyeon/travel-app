import * as Updates from 'expo-updates'

export type BundleUpdate = {
  /**
   * 새 번들을 받아둔다. 비필수는 받아두면 다음 실행 때 네이티브가 적용하므로 여기서 끝난다.
   * 필수는 받은 뒤 재시작하며, 재시작하면 이 Promise 는 끝나지 않는다.
   */
  install: () => Promise<void>
}

export type AppBundleManager = {
  /** 원격에 새 번들이 있으면 설치 가능한 핸들을, 없으면 null 을 돌려준다. */
  checkForUpdate: () => Promise<BundleUpdate | null>
}

type AvailableBundle = {
  isMandatory: boolean
}

/**
 * 실행 중·대기 중 번들은 재시작 후에도 유지돼야 하므로 네이티브(expo-updates)가 소유하고,
 * 이 모듈은 상태를 들고 있지 않는다.
 */
export const appBundleManager: AppBundleManager = {
  async checkForUpdate() {
    const availableBundle = await fetchAvailableBundle()
    if (availableBundle == null) return null

    return {
      install: async () => {
        await downloadBundle()
        if (availableBundle.isMandatory) await reloadWithDownloadedBundle()
      },
    }
  },
}

/** 개발 빌드처럼 업데이트가 꺼진 환경에서는 확인하지 않는다. 필수 여부는 manifest.extra.expoClient.extra 에서 읽는다. */
async function fetchAvailableBundle(): Promise<AvailableBundle | null> {
  if (!Updates.isEnabled) return null

  const result = await Updates.checkForUpdateAsync()
  if (!result.isAvailable) return null

  return { isMandatory: isMandatoryManifest(result.manifest) }
}

function isMandatoryManifest(manifest: Updates.Manifest) {
  if (!('extra' in manifest)) return false
  return manifest.extra?.expoClient?.extra?.isMandatory === true
}

/** 받은 번들은 다음 실행 때 적용된다. */
async function downloadBundle(): Promise<void> {
  await Updates.fetchUpdateAsync()
}

/**
 * JS 컨텍스트가 새 번들로 바뀌므로 부팅 흐름이 이어지지 않도록 반환하지 않는 Promise 로 둔다.
 */
async function reloadWithDownloadedBundle(): Promise<void> {
  await Updates.reloadAsync()
  await new Promise<never>(() => {})
}
