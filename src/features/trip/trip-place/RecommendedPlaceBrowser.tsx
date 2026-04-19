import CloseIcon from '@mui/icons-material/Close'
import RoomIcon from '@mui/icons-material/Room'
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '~shared/components/ListItem'
import { Map } from '~shared/components/Map'
import type { MapBounds } from '~shared/components/Map'
import { isInMapBounds } from '~shared/components/Map/map.utils'
import { PlaceCategoryColorCode } from '../../place/place.types'
import type { RecommendedPlace } from '../../place/recommended-place.api'
import { useRecommendedPlaces } from './useRecommendedPlaces'

const RECOMMENDED_MARKER_COLOR = '#FF9800'

interface RecommendedPlaceBrowserProps {
  tripId: string
  isOpen: boolean
  isZoomedEnough: boolean
  selectedPlaceId: string | null
  onClose: () => void
  onSelect: (place: RecommendedPlace) => void
}

export function RecommendedPlaceSidePanel({
  tripId,
  isOpen,
  isZoomedEnough,
  selectedPlaceId,
  onClose,
  onSelect,
}: RecommendedPlaceBrowserProps) {
  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      hideBackdrop
      sx={{ zIndex: 10 }}
      PaperProps={{
        sx: {
          width: 360,
          maxWidth: 'calc(100% - 72px)',
          zIndex: 1,
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" p={2} pb={1}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              추천 장소
            </Typography>
            <Typography variant="caption" color="text.secondary">
              현재 지도 위치는 유지돼요
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <RecommendedPlaceBrowserBody
          tripId={tripId}
          isOpen={isOpen}
          isZoomedEnough={isZoomedEnough}
          selectedPlaceId={selectedPlaceId}
          onSelect={onSelect}
        />
      </Box>
    </Drawer>
  )
}

export function RecommendedPlaceBottomSheet({
  tripId,
  isOpen,
  isZoomedEnough,
  selectedPlaceId,
  onClose,
  onSelect,
}: RecommendedPlaceBrowserProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={[0.55, 0.85]} defaultSnapIndex={0}>
      <BottomSheet.Header>
        <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
          <Box>
            <Typography variant="h6">추천 장소</Typography>
            <Typography variant="caption" color="text.secondary">
              현재 지도 위치는 유지돼요
            </Typography>
          </Box>
          <Button size="small" variant="text" onClick={onClose}>
            닫기
          </Button>
        </Stack>
      </BottomSheet.Header>
      <RecommendedPlaceBrowserBody
        tripId={tripId}
        isOpen={isOpen}
        isZoomedEnough={isZoomedEnough}
        selectedPlaceId={selectedPlaceId}
        onSelect={onSelect}
      />
    </BottomSheet>
  )
}

function RecommendedPlaceBrowserBody({
  tripId,
  isOpen,
  isZoomedEnough,
  selectedPlaceId,
  onSelect,
}: Omit<RecommendedPlaceBrowserProps, 'onClose'>) {
  const { data: places = [] } = useRecommendedPlaces(tripId, isOpen)

  if (places.length === 0) {
    return (
      <Box px={2} pb={2}>
        <Typography variant="body2" color="text.secondary">
          아직 추천할 장소가 없어요
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Box px={2} pb={1}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip label={`추천 ${places.length}곳`} size="small" />
          {!isZoomedEnough && (
            <Chip
              label="지도를 더 확대하면 추천 위치가 보여요"
              size="small"
              sx={{ bgcolor: 'rgba(0,0,0,0.08)' }}
            />
          )}
        </Stack>
      </Box>
      <Box sx={{ px: 2, pb: 2, overflowY: 'auto', flex: 1 }}>
        <Stack spacing={1}>
          {places.map(place => (
            <RecommendedPlaceListItem
              key={place.id}
              place={place}
              selected={place.id === selectedPlaceId}
              onClick={() => onSelect(place)}
            />
          ))}
        </Stack>
      </Box>
    </>
  )
}

function RecommendedPlaceListItem({
  place,
  selected,
  onClick,
}: {
  place: RecommendedPlace
  selected: boolean
  onClick: () => void
}) {
  const accentColor = place.category ? PlaceCategoryColorCode[place.category] : RECOMMENDED_MARKER_COLOR

  return (
    <ListItem.Button
      focused={selected}
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 2,
        px: 1.25,
        py: 1,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid',
            borderColor: selected ? 'primary.main' : accentColor,
            bgcolor: `${accentColor}22`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {place.photos[0] ? (
            <Box component="img" src={place.photos[0]} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <RoomIcon sx={{ color: accentColor }} />
          )}
        </Box>
        <Stack spacing={0.5} minWidth={0} flex={1}>
          <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle2" noWrap>
              {place.name}
            </Typography>
            {place.tripCount > 1 && <Chip label={`${place.tripCount}회`} size="small" sx={{ height: 20 }} />}
          </Stack>
          <Chip
            label={place.recommendLabel}
            size="small"
            sx={{
              width: 'fit-content',
              bgcolor: `${accentColor}18`,
              color: accentColor,
            }}
          />
          {place.address && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {place.address}
            </Typography>
          )}
        </Stack>
      </Stack>
    </ListItem.Button>
  )
}

export function RecommendedMarkers({
  tripId,
  bounds,
  selectedPlaceId,
  onSelect,
  onOpen,
}: {
  tripId: string
  bounds: MapBounds | null
  selectedPlaceId: string | null
  onSelect: (place: RecommendedPlace) => void
  onOpen: (place: RecommendedPlace) => void
}) {
  const { data: recommended } = useRecommendedPlaces(tripId)
  const visiblePlaces = bounds
    ? recommended.filter(place => isInMapBounds(place.lat, place.lng, bounds))
    : recommended

  return (
    <>
      {visiblePlaces.map(place => {
        const thumbnailUrl = place.photos[0]

        return (
          <Map.Marker
            key={`rec-${place.id}`}
            lat={place.lat}
            lng={place.lng}
            label={place.name}
            variant="circle"
            color="#EB5757"
            opacity={0.8}
            outlined={!thumbnailUrl}
            thumbnailUrl={thumbnailUrl}
            tooltip={[place.recommendLabel, place.name]}
            onClick={() => {
              onSelect(place)
              onOpen(place)
            }}
          />
        )
      })}
    </>
  )
}
