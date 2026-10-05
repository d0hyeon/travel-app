import { useIsMobile } from '~shared/hooks/env/useIsMobile';
import MostSavedDesktopPage from './MostSavedPage.desktop'
import MostSavedMobilePage from './MostSavedPage.mobile'

export default function MostSavedPage() {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <MostSavedMobilePage />
  }
  return <MostSavedDesktopPage />


}

