import { useIsMobile } from '~shared/hooks/env/useIsMobile';
import TopVisitedDesktopPage from './TopVisitedPage.desktop'
import TopVisitedMobilePage from './TopVisitedPage.mobile'

export default function TopVisitedPage() {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <TopVisitedMobilePage />
  }
  return <TopVisitedDesktopPage />


}

