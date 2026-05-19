import { Box, Skeleton, Stack, Tab, Tabs } from "@mui/material";
import { Suspense } from "react";
import { PostCard } from "~features/post/PostCard";
import { TopNavigation } from "~shared/components/layout/TopNavigation.mobile";
import { useQueryParamState } from "~shared/hooks/urls/useQueryParamState";
import { usePlaceFeed } from "../../post/place-feed/usePlaceFeed";
import { usePlace } from "../usePlace";
import { PlaceInfoWidget } from "../PlaceInfoWIdget";
import { usePlaceId } from "./usePlaceId";

type TabType = 'info' | 'feed'

interface Props {
  placeId: string;
}

export default function PlaceDetailPage() {
  const placeId = usePlaceId();
  const [currentTab, setCurrentTab] = useQueryParamState<TabType>('tab', {
    defaultValue: 'info',
  })

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Suspense fallback={<PlaceHeader.Pending />}>
        <PlaceHeader placeId={placeId} />
      </Suspense>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={(_, value: TabType) => setCurrentTab(value)}
          variant="fullWidth"
        >
          <Tab label="기본정보" value="info" />
          <Tab label="피드" value="feed" />
        </Tabs>
      </Box>

      <Box flex={1} overflow="auto">
        {currentTab === 'info' && (
          <Box padding={2}>
            <PlaceInfoWidget placeId={placeId} />
          </Box>
        )}
        {currentTab === 'feed' && (
          <Suspense fallback={<PlaceFeed.Pending />}>
            <PlaceFeed placeId={placeId} />
          </Suspense>
        )}
      </Box>
    </Box>
  )
}

function PlaceHeader({ placeId }: Props) {
  const { data: { name } } = usePlace(placeId);

  return (
    <TopNavigation position="sticky">
      {name}
    </TopNavigation>
  )
}
PlaceHeader.Pending = () => {
  return (
    <TopNavigation>
      <Skeleton variant="text" width={120} />
    </TopNavigation>
  )
}

function PlaceFeed({ placeId }: Props) {
  const { data: { feed } } = usePlaceFeed(placeId);

  if (feed.length === 0) {
    return (
      <Box textAlign="center" py={8} color="text.secondary" fontSize={14}>
        아직 이 장소의 기록이 없어요
      </Box>
    )
  }

  return (
    <Stack gap={2} padding={2} bgcolor={theme => theme.palette.grey[200]}>
      {feed.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </Stack>
  )
}
PlaceFeed.Pending = () => {
  return (
    <Stack gap={2} padding={2}>
      <Skeleton height={300} />
      <Skeleton height={300} />
      <Skeleton height={300} />
    </Stack>
  )
}
