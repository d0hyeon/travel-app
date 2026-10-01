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
 * expo-updates 도입 전까지의 자리다. 원격 조회 결과가 항상 "최신"이라 checkForUpdate 가
 * null 을 돌려주므로 install 은 실제로 호출되지 않는다. 실행 중·대기 중 번들은 재시작 후에도
 * 유지돼야 하므로 네이티브(expo-updates)가 소유하고, 이 모듈은 상태를 들고 있지 않는다.
 * 아래 함수들의 내부만 expo-updates 호출로 교체한다.
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

/**
 * expo-updates 연동 시 Updates.checkForUpdateAsync() 로 교체한다. Updates.isEnabled 가 false 인
 * 개발 빌드는 null 을 돌려주고, 필수 여부는 manifest.extra 에서 읽는다.
 */
function fetchAvailableBundle(): Promise<AvailableBundle | null> {
  return Promise.resolve(null)
}

/** expo-updates 연동 시 Updates.fetchUpdateAsync() 로 교체한다. 받은 번들은 다음 실행 때 적용된다. */
function downloadBundle(): Promise<void> {
  return Promise.resolve()
}

/**
 * expo-updates 연동 시 Updates.reloadAsync() 로 교체한다. JS 컨텍스트가 새 번들로 바뀌므로
 * 부팅 흐름이 이어지지 않도록 반환하지 않는 Promise 로 둔다.
 */
function reloadWithDownloadedBundle(): Promise<void> {
  return Promise.resolve()
}
