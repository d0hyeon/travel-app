import { Map } from "~shared/components/Map";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useExplorerDetailOverlay } from "./explorer-detail/useExplorerDetailOverlay";

import { Box, type BoxProps } from "@mui/material";
import { useExploredPlaces } from "./explorer-ranking/useExploredPlaces";
import { useRecentHotPlaces } from "./explorer-recent/useRecentHotPlaces";
import { useExplorerFilterParams } from "./explorer-filters/useExplorerFilterParams";
import { getCoordinateByLocation } from "~features/location";

export function ExplorerMap(props: BoxProps) {
  const { category, location } = useExplorerFilterParams();
  const { data: places } = useExploredPlaces(location, category);
  const { data: hotPlaces } = useRecentHotPlaces({ inquiryMonths: 3, category, location });

  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay();

  return (
    <Box {...props}>
      <Map
        type="google"
        sx={{ width: '100%', height: '100%' }}
        autoFocus="marker"
        clustering
        clusterGridSize={60}
        defaultCenter={location ? getCoordinateByLocation(location) : undefined}
      >
        {places.map((place) => {
          const isPopular = place.visitorCount >= 2
          return (
            <Map.Marker
              key={place.placeId}
              id={place.placeId}
              lat={place.lat}
              lng={place.lng}
              label={place.name}
              color={isPopular ? MARKER_COLOR_POPULAR : MARKER_COLOR_DEFAULT}
              thumbnailUrl={place.thumbnailUrl}
              onClick={() => {
                isMobile ? openFullScreen(place) : openSideSheet(place)
              }}
            />
          )
        })}
        {hotPlaces.map(place => (
          <Map.Marker
            key={place.placeId}
            id={place.placeId}
            lat={place.lat}
            lng={place.lng}
            label={`[핫플] ${place.name}`}
            color={MARKER_COLOR_POPULAR}
            thumbnailUrl={place.thumbnailUrl}
            onClick={() => {
              isMobile ? openFullScreen(place) : openSideSheet(place)
            }}
          />
        ))}
      </Map>
    </Box>
  )
}

const MARKER_COLOR_DEFAULT = '#1976d2'
const MARKER_COLOR_POPULAR = '#ff6b35'