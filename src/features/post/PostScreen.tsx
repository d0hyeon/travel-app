import { Box, Button, Dialog, DialogActions, DialogContent, ImageList, ImageListItem, Skeleton, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { PlaceInfoWidget } from '~features/place/PlaceInfoWIdget'
import { UserProfile } from '~features/user-profile/UserProfile'
import { ListItem } from '~shared/components/ListItem'
import { Map } from '~shared/components/Map'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { DialogTitle } from '~shared/components/confirm-dialog/DialogTitle'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { isOverseasByCoordinate } from '~shared/utils/geo'
import { PostLikeButton } from './PostLikeButton'
import type { PostPlace } from './post.types'
import { usePost } from './usePost'

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
  const isMobile = useIsMobile();
  const overlay = useOverlay();

  const openPlaceOverlay = (place: PostPlace) => {
    overlay.open(({ isOpen, close }) => {
      if (isMobile) {
        return (
          <BottomSheet isOpen={isOpen} onClose={close}>
            <BottomSheet.Header>{place.name}</BottomSheet.Header>
            <BottomSheet.Body>
              <BottomSheet.Scrollable>
                <PlaceInfoWidget placeId={place.placeId} />
              </BottomSheet.Scrollable>
            </BottomSheet.Body>
          </BottomSheet>
        )
      }
      return (
        <Dialog open={isOpen} onClose={close}>
          <DialogTitle>{place.name}</DialogTitle>
          <DialogContent>
            <PlaceInfoWidget placeId={place.placeId} />
          </DialogContent>
          <DialogActions>
            <Button variant="contained">닫기</Button>
          </DialogActions>
        </Dialog>
      )
    })

  }

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
                onClick={() => openPlaceOverlay(place)}
              />
            ))}
          </Map>
          <Stack gap={1}>
            {post.places.map(place => (
              <ListItem key={place.placeId} onClick={() => openPlaceOverlay(place)}>
                <ListItem.Title>{place.name}</ListItem.Title>
                <ListItem.Text>{place.address}</ListItem.Text>
              </ListItem>
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