import { useIsMobile } from '~shared/hooks/env/useIsMobile';
import RecentHotDesktopPage from './RecentHotPage.desktop'
import RecentHotMobilePage from './RecentHotPage.mobile'

export default function RecentHotPage() {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <RecentHotMobilePage />
  }
  return <RecentHotDesktopPage />


}

