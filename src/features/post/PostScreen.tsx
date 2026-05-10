import { Box, ImageList, ImageListItem, Skeleton, Stack, Typography } from '@mui/material'
import { PhotoThunbnail } from '~shared/components/photo/PhotoThumbnail'
import { PostLikeButton } from './PostLikeButton'
import type { Post } from './post.types'
import { usePost } from './usePost'
import { isOverseasByCoordinate } from '~shared/utils/geo'
import { Map } from '~shared/components/Map'
import { Suspense } from 'react'
import { UserProfile } from '~features/user-profile/UserProfile'

interface Props {
  postId: string
}

export function PostScreen(props: Props) {
  return (
    <Suspense fallback={<Pending />}>
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({ postId }: Props) {
  const { data: post } = usePost(postId);

  return (
    <Stack spacing={2} px={2} py={2}>
      <UserProfile id={post.authorId} />
      {post.title && (
        <Typography variant="h6">{post.title}</Typography>
      )}

      <ImageList cols={1} gap={8}>
        {post.photos.map(photo => (
          <ImageListItem key={photo.url}>
            <PhotoThunbnail src={photo.url} />
          </ImageListItem>
        ))}
      </ImageList>

      {post.description && (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {post.description}
        </Typography>
      )}

      {post.places.length > 0 && (
        <Map
          type={isOverseasByCoordinate(post.places[0].lat, post.places[0].lng) ? 'google' : 'kakao'}
          center={post.places[0]}
          height={300}
          borderRadius={4}
        >
          {post.places.map((place) => (
            <Map.Marker
              key={place.placeId}
              label={place.name}
              variant="pin"
              lat={place.lat}
              lng={place.lng}
            />
          ))}
        </Map>
      )}
      <Box>
        <PostLikeButton postId={post.id} />
      </Box>
    </Stack>
  )
}

function Pending() {
  return (
    <Stack spacing={2} px={2} py={2}>
      <Skeleton variant='text' />

      <ImageList cols={1} gap={8}>
        <ImageListItem >
          <Skeleton height={500} />
          <Skeleton height={500} />
        </ImageListItem>
      </ImageList>

    </Stack>
  )
}