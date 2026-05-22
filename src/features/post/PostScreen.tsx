import { Box, ImageList, ImageListItem, Skeleton, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { UserProfile } from '~features/user-profile/UserProfile'
import { ListItem } from '~shared/components/ListItem'
import { Map } from '~shared/components/Map'
import { isOverseasByCoordinate } from '~shared/utils/geo'
import { PostLikeButton } from './PostLikeButton'
import { usePost } from './usePost'
import { useScrollRestore } from '~shared/hooks/interaction/useScrollRestore'
import { generatePath, Link, useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'

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
  const navigate = useNavigate()

  return (
    <Stack spacing={2} px={2} py={2}>
      <UserProfile id={post.authorId} />
      {post.title && (
        <Typography variant="h6">{post.title}</Typography>
      )}

      <ImageList cols={1} gap={8}>
        {post.photos.map(photo => (
          <Box
            key={photo.url}
            component="img"
            src={photo.url}
            borderRadius={4}
          />
        ))}
      </ImageList>

      {post.description && (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {post.description}
        </Typography>
      )}

      {post.places.length > 0 && (
        <>
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
                onClick={() => navigate(generatePath(AppRoute.장소_상세, { placeId: place.placeId }))}
              />
            ))}
          </Map>
          <Stack gap={1}>
            {post.places.map(place => (
              <Link key={place.placeId} to={generatePath(AppRoute.장소_상세, { placeId: place.placeId })} viewTransition>
                <ListItem key={place.placeId}>
                  <ListItem.Title>{place.name}</ListItem.Title>
                  <ListItem.Text>{place.address}</ListItem.Text>
                </ListItem>
              </Link>
            ))}
          </Stack>
        </>
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