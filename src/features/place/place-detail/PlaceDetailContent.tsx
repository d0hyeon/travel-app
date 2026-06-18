import { Box, Skeleton, Stack } from '@mui/material'
import { generatePath, Link } from 'react-router'
import { AppRoute } from '~app/routes'
import { PostCard } from '~features/post/PostCard'
import { usePlaceFeed } from '../../post/place-feed/usePlaceFeed'
import { PlaceInfoWidget } from '../PlaceInfoWIdget'

interface Props {
  placeId: string
}

export const PlaceDetailContent = {
  Feed: PlaceFeed,
  Info: PlaceInfoWidget,
} as const;




function PlaceFeed({ placeId }: Props) {
  const { data: { feed } } = usePlaceFeed(placeId)

  if (feed.length === 0) {
    return (
      <Box textAlign="center" py={8} color="text.secondary" fontSize={14}>
        아직 이 장소의 기록이 없어요
      </Box>
    )
  }

  return (
    <Stack gap={2} padding={2} bgcolor={(theme) => theme.palette.grey[200]}>
      {feed.map((post) => (
        <Link key={post.id} to={generatePath(AppRoute.포스트_상세, { postId: post.id })} viewTransition>
          <PostCard post={post} />
        </Link>
      ))}
    </Stack>
  )
}

PlaceFeed.Pending = () => (
  <Stack gap={2} padding={2}>
    <Skeleton height={300} />
    <Skeleton height={300} />
    <Skeleton height={300} />
  </Stack>
)
