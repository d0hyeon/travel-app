import Check from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { upsertPlace } from '@waylog/domains/modules/place'
import { usePlaceSearchBottomSheet } from '~features/place/place-search/usePlaceSearchBottomSheet'
import { usePlaceSearchDialog } from '~features/place/place-search/usePlaceSearchDialog'
import { useTripPlaces } from '@waylog/domains/modules/trip'
import { ListItem } from '~shared/components/ListItem'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'

export interface PostPlaceSelection {
  placeId: string
  name: string
  address: string | null
}

interface Props {
  tripId?: string | null
  defaultValue?: PostPlaceSelection[]
  onChange?: (value: PostPlaceSelection[]) => void
}

export function PostPlacesField({ tripId, defaultValue, onChange }: Props) {
  const [selected, setSelected] = useState<PostPlaceSelection[]>(defaultValue ?? [])
  const isMobile = useIsMobile()
  const { searchPlace: searchPlaceDialog } = usePlaceSearchDialog()
  const { searchPlace: searchPlaceBottomSheet } = usePlaceSearchBottomSheet()
  const searchPlace = isMobile ? searchPlaceBottomSheet : searchPlaceDialog

  useEffect(() => {
    onChange?.(selected)
  }, [selected])

  const togglePlace = (place: PostPlaceSelection) => {
    setSelected((prev) =>
      prev.some((p) => p.placeId === place.placeId)
        ? prev.filter((p) => p.placeId !== place.placeId)
        : [...prev, place],
    )
  }

  const removePlace = (placeId: string) => {
    setSelected((prev) => prev.filter((p) => p.placeId !== placeId))
  }

  const handleSearchAdd = async () => {
    const result = await searchPlace()
    if (!result) return
    const place = await upsertPlace(result.provider, result.externalId, {
      name: result.name,
      address: result.address,
      lat: result.lat,
      lng: result.lng,
    })
    setSelected((prev) =>
      prev.some((p) => p.placeId === place.id)
        ? prev
        : [...prev, { placeId: place.id, name: place.name, address: place.address }],
    )
  }

  return (
    <Stack spacing={2} py={1}>
      {selected.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {selected.map((place) => (
            <Chip
              key={place.placeId}
              label={place.name}
              onDelete={() => removePlace(place.placeId)}
              deleteIcon={<CloseIcon />}
            />
          ))}
        </Stack>
      )}

      <ListItem.Button onClick={handleSearchAdd} rightAddon={<SearchIcon fontSize="small" />}>
        <ListItem.Title>장소 검색해서 추가</ListItem.Title>
      </ListItem.Button>

      {tripId && <TripPlaceList tripId={tripId} selected={selected} onToggle={togglePlace} />}
    </Stack>
  )
}

function TripPlaceList({
  tripId,
  selected,
  onToggle,
}: {
  tripId: string
  selected: PostPlaceSelection[]
  onToggle: (place: PostPlaceSelection) => void
}) {
  const { data: tripPlaces } = useTripPlaces(tripId)
  const selectedIds = new Set(selected.map((p) => p.placeId))

  if (tripPlaces.length === 0) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary">
          이 여행에 등록된 장소가 없습니다
        </Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        이 여행의 장소
      </Typography>
      {tripPlaces.map((tripPlace) => {
        const checked = selectedIds.has(tripPlace.placeId)
        return (
          <ListItem.Button
            key={tripPlace.id}
            rightAddon={checked ? <Check color="primary" fontSize="small" /> : undefined}
            onClick={() =>
              onToggle({
                placeId: tripPlace.placeId,
                name: tripPlace.name,
                address: tripPlace.address || null,
              })
            }
          >
            <ListItem.Title>{tripPlace.name}</ListItem.Title>
            <ListItem.Text>{tripPlace.address}</ListItem.Text>
          </ListItem.Button>
        )
      })}
    </Stack>
  )
}
