import { Box, Skeleton, Tab, Tabs } from '@mui/material'
import { Suspense } from 'react'
import { ContentContainer } from '~shared/components/layout/ContentContainer'
import { TopNavigation as DesktopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { TopNavigation as MobileNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { usePlace } from '@waylog/domains/modules/place'
import { PlaceBookmarkButton } from '../PlaceBookmarkButton'
import { PlaceDetailContent } from './PlaceDetailContent'
import { usePlaceId } from './usePlaceId'

type ContentType = keyof typeof PlaceDetailContent;

export const meta = () => [
  { title: '장소 상세 — WayLog' },
  { property: 'og:title', content: '장소 상세 — WayLog' },
]

export default function PlaceDetailPage() {
  const isMobile = useIsMobile()
  const placeId = usePlaceId()
  const [currentTab, setCurrentTab] = useQueryParamState<ContentType>('tab', {
    defaultValue: 'Info',
  })

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Suspense fallback={<PlaceHeader.Pending />}>
        <PlaceHeader placeId={placeId} />
      </Suspense>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0, mt: isMobile ? -1 : 0 }}>
        <ContentContainer>
          <Tabs
            value={currentTab}
            onChange={(_, value) => setCurrentTab(value)}
            variant="fullWidth"
          >
            <Tab label="기본정보" value="Info" />
            <Tab label="피드" value="Feed" />
          </Tabs>
        </ContentContainer>
      </Box>

      <Box flex={1} overflow="auto">
        <ContentContainer>
          <SwitchCase
            value={currentTab}
            cases={{
              Info: (
                <Box padding={2}>
                  <PlaceDetailContent.Info placeId={placeId} />
                </Box>
              ),
              Feed: (
                <Suspense fallback={<PlaceDetailContent.Feed.Pending />}>
                  <PlaceDetailContent.Feed placeId={placeId} />
                </Suspense>
              )
            }}
          />
        </ContentContainer>
      </Box>
    </Box>
  )
}

function PlaceHeader({ placeId }: { placeId: string }) {
  const isMobile = useIsMobile()
  const TopNavigation = isMobile ? MobileNavigation : DesktopNavigation
  const { data: { name } } = usePlace(placeId)

  return (
    <TopNavigation
      position="sticky"
      sx={{ borderBottomWidth: 0, pb: isMobile ? undefined : 0 }}
      rightElement={<PlaceBookmarkButton placeId={placeId} />}
    >
      {name}
    </TopNavigation>
  )
}

function PlaceHeaderPending() {
  const isMobile = useIsMobile()
  const TopNavigation = isMobile ? MobileNavigation : DesktopNavigation

  return (
    <TopNavigation sx={{ borderBottomWidth: 0, pb: isMobile ? undefined : 0 }}>
      <Skeleton variant="text" width={120} />
    </TopNavigation>
  )
}
PlaceHeader.Pending = PlaceHeaderPending
