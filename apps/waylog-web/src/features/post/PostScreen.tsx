import { Box, ImageList, ImageListItem, Skeleton, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { generatePath, Link } from 'react-router'
import { AppRoute } from '~app/routes'
import { useAuth } from '@waylog/domains/auth'
import { PlaceFullScreenModal } from '~features/place/place-detail/PlaceFullScreenModal'
import { UserProfile } from '~features/user-profile/UserProfile'
import { ListItem } from '~shared/components/ListItem'
import { Map } from '~shared/components/Map'
import { useRouteOverlay } from '~shared/hooks/extends/route-overlay/useRouteOverlay'
import { isOverseasByCoordinate } from '@waylog/domains/utils'
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
  const { open: openPlaceOverlay, Link: OverlayLink } = useRouteOverlay(
    (placeId: string) => generatePath(AppRoute.장소_상세, { placeId }),
    ({ isOpen, close, data: placeId }) => isMobile
      ? <PlaceFullScreenModal placeId={placeId} onClose={close} isOpen={isOpen} />
      : <PlaceSidePanel placeId={placeId} onClose={close} isOpen={isOpen} />
  )

  return (
    <Stack spacing={2} px={2} py={2}>
      <Link to={generatePath(AppRoute.유저_프로필, { userId: post.authorId })}>
        <UserProfile id={post.authorId} />
      </Link>
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
                onClick={() => openPlaceOverlay(place.placeId)}
              />
            ))}
          </Map>
          <Stack gap={1}>
            {post.places.map(place => (
              <OverlayLink key={place.placeId} data={place.placeId}>
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