import { Box, ImageList, ImageListItem, Skeleton, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { generatePath } from 'react-router'
import { AppRoute } from '~app/routes'
import { useAuth } from '~features/auth/useAuth'
import { PlaceFullScreenModal } from '~features/place/place-detail/PlaceFullScreenModal'
import { UserProfile } from '~features/user-profile/UserProfile'
import { ListItem } from '~shared/components/ListItem'
import { Map } from '~shared/components/Map'
import { useOverlayRoute, type OverlayRouteRenderProps } from '~shared/hooks/extends/useOverlayRoute'
import { isOverseasByCoordinate } from '~shared/utils/geo'
import { PostLikeButton } from './PostLikeButton'
import { usePost } from './usePost'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { PlaceSidePanel } from '~features/place/place-detail/PlaceSidePanel'

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
  const { data: auth } = useAuth({ required: false });

  const isMobile = useIsMobile();
  const { navigate: navigateInOverlay, Link: OverlayLink, back } = useOverlayRoute({
    component: ({ state: placeId, isOpen }: OverlayRouteRenderProps<string>) => isMobile
      ? <PlaceFullScreenModal placeId={placeId} onClose={back} isOpen={isOpen} />
      : <PlaceSidePanel placeId={placeId} onClose={back} isOpen={isOpen} />
  })

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
                onClick={() => navigateInOverlay(generatePath(AppRoute.장소_상세, { placeId: place.placeId }), place.placeId)}
              />
            ))}
          </Map>
          <Stack gap={1}>
            {post.places.map(place => (
              <OverlayLink
                key={place.placeId}
                state={place.placeId}
                to={generatePath(AppRoute.장소_상세, { placeId: place.placeId })}
              >
                <ListItem key={place.placeId}>
                  <ListItem.Title>{place.name}</ListItem.Title>
                  <ListItem.Text>{place.address}</ListItem.Text>
                </ListItem>
              </OverlayLink>
            ))}
          </Stack>
        </>
      )}
      <Box>
        {auth == null
          ? <PostLikeButton.Readonly postId={post.id} />
          : <PostLikeButton postId={post.id} />
        }
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