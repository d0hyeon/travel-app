import { Map } from "~shared/components/Map";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useExplorerDetailOverlay } from "./explorer-detail/useExplorerDetailOverlay";
import { useExploredPlaces } from "./useExploredPlaces";
import { Box, type BoxProps } from "@mui/material";

export function ExplorerMap(props: BoxProps) {
  const { data: places } = useExploredPlaces();
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay();

  return (
    <Box {...props}>
      <Map type="google" sx={{ width: '100%', height: '100%' }} autoFocus="marker" clustering clusterGridSize={60}>
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
      </Map>
    </Box>
  )
}

const MARKER_COLOR_DEFAULT = '#1976d2'
const MARKER_COLOR_POPULAR = '#ff6b35'