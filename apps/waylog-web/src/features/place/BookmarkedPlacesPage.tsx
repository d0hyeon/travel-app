import { Stack, Typography } from '@mui/material'
import { useBookmarkedPlaces } from '@waylog/domains/modules/place-bookmark'
import { PlaceListItem } from '~features/explorer/explorer-place-item/PlaceListItem'
import { ContentContainer } from '~shared/components/layout/ContentContainer'
import { TopNavigation as DesktopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { TopNavigation as MobileNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { usePlaceDetailOverlay } from './place-detail/usePlaceDetailOverlay'

export default function BookmarkedPlacesPage() {
  const isMobile = useIsMobile()
  const TopNavigation = isMobile ? MobileNavigation : DesktopNavigation
  const { data: bookmarkedPlaces } = useBookmarkedPlaces()
  const placeDetailOverlay = usePlaceDetailOverlay()

  return (
    <Stack>
      <TopNavigation position="sticky" sx={isMobile ? { borderBottomWidth: 0 } : undefined}>
        저장된 장소
      </TopNavigation>
      <ContentContainer paddingY={isMobile ? 0 : 2}>
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
      </ContentContainer>
    </Stack>
  )
}
