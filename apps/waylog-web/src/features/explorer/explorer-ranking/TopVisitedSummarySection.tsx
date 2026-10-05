import { Box, Skeleton } from '@mui/material'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { PlaceListItem } from '../explorer-place-item/PlaceListItem'
import { MOBILE_SKELETON_ROWS } from './topVisitedSection.constants'

import { TopVisitedSummarySection as TopVisitedSectionDesktop } from './TopVisitedSummarySection.desktop'
import { TopVisitedSummarySection as TopVisitedSectionMobile } from './TopVisitedSummarySection.mobile'

export function TopVisitedSummarySection() {
  const isMobile = useIsMobile()
  if (isMobile) return <TopVisitedSectionMobile />;

  return <TopVisitedSectionDesktop />
}

TopVisitedSummarySection.Skeleton = () => (
  <Box>
    <Skeleton variant="text" width={100} height={28} sx={{ mx: 2, mb: 1.5 }} />
    {Array.from({ length: MOBILE_SKELETON_ROWS }).map((_, i) => (
      <PlaceListItem.Skeleton key={i} />
    ))}
  </Box>
)
