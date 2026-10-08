import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import SuitBold from '../../../assets/fonts/SUIT-Bold.ttf'
import SuitHeavy from '../../../assets/fonts/SUIT-Heavy.ttf'
import SuitRegular from '../../../assets/fonts/SUIT-Regular.ttf'
import { appBundleManager } from './appBundleManager'
import { checkRequiredAppUpdate, type RequiredAppUpdate } from './appUpdateRequirement'
import { ForcedUpdateScreen } from './ForcedUpdateScreen'
import { getSession, prepareSession, sessionProfileQuery } from '@waylog/domains/clients'
import { hydrateLastReadAt } from '@waylog/domains/modules/trip-chat'
import { queryClient } from '~shared/query-client'

void SplashScreen.preventAutoHideAsync()

const MIN_SPLASH_TIME = 1000;

export function AppBootstrap({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [requiredUpdate, setRequiredUpdate] = useState<RequiredAppUpdate | null>(null);
  const { waitForReady: waitForResolveBundle } = useAutoBundleUpdate();

  const [isFontsLoaded] = useFonts({
    SUIT: SuitRegular,
    'SUIT-Bold': SuitBold,
    'SUIT-Heavy': SuitHeavy,
  })
  
  useEffect(() => {
    const initializationTasks = [
      waitForResolveBundle(),
      prepareSession().then(() => prefetchSessionResources()),
      hydrateLastReadAt(),
      checkRequiredAppUpdate().then(setRequiredUpdate),
      delay(MIN_SPLASH_TIME)
    ];
    
    Promise.all(initializationTasks)
      .then(async () => {
        setIsReady(true);
      })
  }, [])

  const isAppReady = isReady && isFontsLoaded

  useEffect(() => {
    if (isAppReady) SplashScreen.hideAsync()
  }, [isAppReady])

  if (!isAppReady) return null
  if (requiredUpdate != null) return <ForcedUpdateScreen {...requiredUpdate} />

  return children;
}

function prefetchSessionResources() {
  const session = getSession();
  if(session == null) return Promise.resolve();

  return queryClient.prefetchQuery(sessionProfileQuery(session.id))    
}

/**
 * 새 번들이 있으면 받아둔다. 비필수는 다음 실행 때 적용되고,
 * 필수는 받은 뒤 재시작하므로 이 흐름은 이어지지 않고 새 번들이 처음부터 다시 부팅한다.
 */
function useAutoBundleUpdate() {
  const [status] = useState(() => Promise.withResolvers<void>())

  useEffect(() => {
    async function installAvailableUpdate() {
      const update = await appBundleManager.checkForUpdate()
      await update?.install()
    }

    installAvailableUpdate().finally(() => status.resolve())
  }, [status])

  return useMemo(() => {
    return {
      waitForReady: () => status.promise
    }
  }, [status])
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  })
}