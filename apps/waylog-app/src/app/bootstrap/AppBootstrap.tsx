import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import SuitBold from '../../../assets/fonts/SUIT-Bold.ttf'
import SuitHeavy from '../../../assets/fonts/SUIT-Heavy.ttf'
import SuitRegular from '../../../assets/fonts/SUIT-Regular.ttf'
import { AppSplashScreen } from './AppSplashScreen'
import { useAppBundleManager } from './useAppBundleManager'
import { prepareSession } from '@waylog/domains/clients'

void SplashScreen.preventAutoHideAsync()

const MIN_SPLASH_TIME = 1000;

export function AppBootstrap({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const { waitForReady: waitForResolveBundle } = useAutoBundleUpdate();

  const [isFontsLoaded] = useFonts({
    SUIT: SuitRegular,
    'SUIT-Bold': SuitBold,
    'SUIT-Heavy': SuitHeavy,
  })

  useEffect(() => {
    const initializationTasks = [
      waitForResolveBundle(),
      prepareSession(),
      delay(MIN_SPLASH_TIME)
    ];

    Promise.all(initializationTasks)
      .then(async () => {
        setIsReady(true);
        SplashScreen.hideAsync();
      })
  }, [])

  if (!isReady || !isFontsLoaded) {
    return <AppSplashScreen />
  }

  return children;
}

/**
 * 이전 부팅에서 받아둔 비필수 번들이 있으면 이번엔 그것부터 적용하고,
 * 없으면 새로 확인해 받아둔 뒤 필수 업데이트일 때만 바로 적용한다.
 */
function useAutoBundleUpdate() {
  const { hasUpdatedBundle, checkForUpdate, applyBundle } = useAppBundleManager()
  const status = useRef(Promise.withResolvers<void>()).current;

  useEffect(() => {
    async function downloadOrApply() {
      const update = await checkForUpdate()
      if (update != null) {
        await update.download();
      }
      if (hasUpdatedBundle || update?.isMandatory) {
        await applyBundle();
      }
    }

    downloadOrApply()
      .then(() => status.resolve())
      .catch(() => status.reject())
  }, [])

  return useMemo(() => {
    return {
      waitForReady: () => status.promise
    }
  }, [])
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  })
}