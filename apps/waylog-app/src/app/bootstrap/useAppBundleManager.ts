import { useRef } from 'react'

export type BundleUpdate = {
  /** true면 다운로드 직후 바로 적용해야 한다. 적용 시점 판단은 소비자 책임이다. */
  isMandatory: boolean
  download: () => Promise<void>
}

export type AppBundleManager = {
  hasUpdatedBundle: boolean
  /** 원격에 새 번들이 있으면 다운로드 가능한 핸들을, 없으면 null 을 돌려준다. */
  checkForUpdate: () => Promise<BundleUpdate | null>
  /** 이미 받아둔 번들을 다음 앱 재시작 시점에 적용되도록 예약한다. 즉시 적용하지 않는다. */
  applyBundle: () => Promise<void>
}

type BundleLabel = string

/**
 * 컨트롤러가 실제로 들고 있어야 할 상태: 지금 실행 중인 번들과, 다운로드는
 * 끝났지만 아직 적용하지 않은 번들. 슬롯은 하나뿐이라 새 다운로드는 이전
 * pending 을 덮어쓴다 — 버전 목록을 여러 개 들고 골라 적용하지 않는다.
 */
type BundleManagerState = {
  currentLabel: BundleLabel
  pendingLabel: BundleLabel | null
}

/**
 * CodePush 도입 전까지의 자리다. 원격 조회 결과가 항상 "최신"이라 checkForUpdate
 * 가 null 을 돌려주므로 다운로드/적용은 실제로 호출되지 않는다. 상태 모양과
 * hasUpdatedBundle/checkForUpdate/applyBundle 의 관계는 SDK 연동 후에도 유지되며,
 * fetchLatestRemoteLabel·downloadBundle·installBundle 내부만 CodePush 호출로 교체한다.
 */
export function useAppBundleManager(): AppBundleManager {
  const state = useRef<BundleManagerState>({ currentLabel: 'native', pendingLabel: null })

  return {
    hasUpdatedBundle: state.current.pendingLabel != null,

    async checkForUpdate() {
      const remoteLabel = await fetchLatestRemoteLabel()
      const isUpToDate = remoteLabel == null || remoteLabel === state.current.currentLabel
      if (isUpToDate) return null

      return {
        isMandatory: await isMandatoryUpdate(remoteLabel),
        download: async () => {
          await downloadBundle(remoteLabel)
          state.current.pendingLabel = remoteLabel
        },
      }
    },

    async applyBundle() {
      const { pendingLabel } = state.current
      if (pendingLabel == null) return
      await installBundle(pendingLabel)
      state.current = { currentLabel: pendingLabel, pendingLabel: null }
    },
  }
}

/** CodePush 연동 시 checkForUpdate(deploymentKey, targetBinaryVersion) 로 교체한다. */
function fetchLatestRemoteLabel(): Promise<BundleLabel | null> {
  return Promise.resolve(null)
}

function isMandatoryUpdate(_remoteLabel: BundleLabel): Promise<boolean> {
  return Promise.resolve(false)
}

/** CodePush 연동 시 RemotePackage.download() 로 교체한다. */
function downloadBundle(_remoteLabel: BundleLabel): Promise<void> {
  return Promise.resolve()
}

/** CodePush 연동 시 LocalPackage.install(InstallMode.ON_NEXT_RESTART) 로 교체한다. */
function installBundle(_label: BundleLabel): Promise<void> {
  return Promise.resolve()
}
