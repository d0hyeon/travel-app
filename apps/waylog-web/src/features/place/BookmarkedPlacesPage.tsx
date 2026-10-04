import { Stack, Typography } from '@mui/material'
import { useBookmarkedPlaces } from '@waylog/domains/modules/place-bookmark'
import { PlaceListItem } from '~features/explorer/explorer-place-item/PlaceListItem'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { usePlaceDetailOverlay } from './place-detail/usePlaceDetailOverlay'

export default function BookmarkedPlacesPage() {
  const { data: bookmarkedPlaces } = useBookmarkedPlaces()
  const placeDetailOverlay = usePlaceDetailOverlay()

  return (
    <Stack>
      <TopNavigation position="sticky" sx={{ borderBottomWidth: 0 }}>
        저장된 장소
      </TopNavigation>
      {bookmarkedPlaces.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={6}>
          저장한 장소가 없어요
        </Typography>
      ) : (
        bookmarkedPlaces.map((place) => (
          <PlaceListItem
            key={place.id}
            place={{
              placeId: place.id,
              name: place.name,
              address: place.address,
              categories: place.category == null ? [] : [place.category],
            }}
            onClick={() => placeDetailOverlay.open(place.id)}
          />
        ))
      )}
    </Stack>
  )
}
