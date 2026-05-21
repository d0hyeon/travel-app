import { Box, Skeleton, Tab, Tabs } from '@mui/material'
import { Suspense } from 'react'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { usePlace } from '../usePlace'
import { PlaceDetailContent } from './PlaceDetailContent'
import { usePlaceId } from './usePlaceId'

type ContentType = keyof typeof PlaceDetailContent;

export default function PlaceDetailPage() {
  const placeId = usePlaceId()
  const [currentTab, setCurrentTab] = useQueryParamState<ContentType>('tab', {
    defaultValue: 'Info',
  })

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Suspense fallback={<PlaceHeader.Pending />}>
        <PlaceHeader placeId={placeId} />
      </Suspense>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Tabs
          value={currentTab}
          onChange={(_, value) => setCurrentTab(value)}
          variant="fullWidth"
        >
          <Tab label="기본정보" value="Info" />
          <Tab label="피드" value="Feed" />
        </Tabs>
      </Box>

      <Box flex={1} overflow="auto">
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
      </Box>
    </Box>
  )
}

function PlaceHeader({ placeId }: { placeId: string }) {
  const { data: { name } } = usePlace(placeId)

  return (
    <TopNavigation position="sticky">
      {name}
    </TopNavigation>
  )
}

PlaceHeader.Pending = () => (
  <TopNavigation>
    <Skeleton variant="text" width={120} />
  </TopNavigation>
)
