import CloseIcon from '@mui/icons-material/Close'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  ImageList,
  ImageListItem,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { Suspense, useState } from 'react'
import { usePlace } from '~features/place/usePlace'
import { usePlaceFeed } from '~features/post/place-feed/usePlaceFeed'
import { PostCard } from '~features/post/PostCard'
import { Map } from '~shared/components/Map'
import { PhotoDialog } from '~shared/components/photo/PhotoDialog'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useOverlay } from '~shared/hooks/useOverlay'
import { isOverseasByCoordinate } from '~shared/utils/geo'
import { usePlacePhotos } from '../../place/usePlacePhotos'
import type { ExploredPlace } from '../explorer.api'

interface Props {
  place: ExploredPlace
  isOpen?: boolean
  onClose: () => void
}

export function PlaceExplorerDetailSidePanel({ place, isOpen = true, onClose }: Props) {
  const [currentTab, changeTab] = useState<'basic' | 'feed'>('basic');

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      hideBackdrop
      sx={{ zIndex: 1000 }}
      PaperProps={{
        sx: {
          width: 500,
          maxWidth: 'calc(100% - 72px)',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" p={2} pb={1}>
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight={700}>{place.name}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Box px={2} pb={2} overflow="auto" flex={1}>
          <Tabs variant="fullWidth" value={currentTab} onChange={(_, value) => changeTab(value)} >
            <Tab label="기본정보" value="basic" />
            <Tab label="피드" value="feed" />
          </Tabs>


          <Box mt={1.5}>
            <Suspense fallback={<Box display="flex" justifyContent="center"><CircularProgress size={20} /></Box>}>
              <SwitchCase
                value={currentTab}
                cases={{
                  basic: <PlaceBasicInfo placeId={place.placeId} />,
                  feed: () => <PlaceFeed placeId={place.placeId} />
                }}
              />
            </Suspense>

          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}
type ContentProps = {
  placeId: string;
}
function PlaceFeed({ placeId }: ContentProps) {
  const { data: { feed } } = usePlaceFeed(placeId);

  if (feed.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" marginTop={5} textAlign="center">
        작성된 피드가 없어요
      </Typography>
    )
  }

  return (
    <Stack gap={1}>
      {feed.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </Stack>
  )
}

function PlaceBasicInfo({ placeId }: { placeId: string }) {
  const { data: place } = usePlace(placeId)
  const { data: photos } = usePlacePhotos(placeId);

  const overlay = useOverlay()

  return (
    <Stack gap={1}>
      <Map
        type={isOverseasByCoordinate(place.lat, place.lng) ? 'google' : 'kakao'}
        height={300}
        center={place}
      >
        <Map.Marker
          {...place}
          label={place.name}
          variant="pin"
        />
      </Map>

      {place.address && (
        <Stack direction="row" alignItems="center" gap={0.25} >
          <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary">{place.address}</Typography>
        </Stack>
      )}
      {photos.length !== 0 && (
        <ImageList cols={2} gap={6} sx={{ mt: 2 }}>
          {photos.map((photo, idx) => (
            <ImageListItem
              key={photo.id}
              sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => {
                overlay.open(({ isOpen, close }) => (
                  <PhotoDialog
                    open={isOpen}
                    onClose={close}
                    photos={photos}
                    initialIndex={idx}
                  />
                ))
              }}
            >
              <img src={photo.url} alt="" loading="lazy" style={{ aspectRatio: '1', objectFit: 'cover', width: '100%' }} />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Stack>
  )
}
