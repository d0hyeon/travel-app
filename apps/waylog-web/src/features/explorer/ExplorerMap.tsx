import { Box, type BoxProps } from "@mui/material";
import { getCoordinateByLocation } from "@waylog/domains/location";
import { Map } from "~shared/components/Map";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useExplorerPlaceModal, useExplorerPlaceSidePannel } from "./useExplorerPlaceOverlay";
import { useExplorerFilterParams } from "./explorer-filters/useExplorerFilterParams";
import { useAttentionPlaces } from "./useAttentionPlaces";

// 0~0.4: 파랑, 0.4~0.6: 주황, 0.6~1.0: 빨강
// 각 구간 내 alpha 0.55→0.9으로 증가 (구간 안에서 강도 구분)
const BLUE = { r: 90, g: 140, b: 215 }
const ORANGE = { r: 242, g: 148, b: 70 }
const RED = { r: 215, g: 75, b: 70 }

function scoreToColor(score: number): string {
  let color: typeof BLUE
  let t: number  // 0~1, 구간 내 진행도

  if (score < 0.4) {
    color = BLUE; t = score / 0.4
  } else if (score < 0.6) {
    color = ORANGE; t = (score - 0.4) / 0.2
  } else {
    color = RED; t = (score - 0.6) / 0.4
  }

  const alpha = (0.55 + t * 0.35).toFixed(2)
  return `rgba(${color.r},${color.g},${color.b},${alpha})`
}

export function ExplorerMap(props: BoxProps) {
  const { category, location } = useExplorerFilterParams();
  const places = useAttentionPlaces({ location, category });

  const isMobile = useIsMobile()
  const { open: openPlaceModal } = useExplorerPlaceModal();
  const { open: openPlaceSidePanel } = useExplorerPlaceSidePannel();

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
        {places.map((place) => (
          <Map.Marker
            key={place.placeId}
            id={place.placeId}
            lat={place.lat}
            lng={place.lng}
            label={place.name}
            color={scoreToColor(place.score)}
            thumbnailUrl={place.thumbnailUrl}
            onClick={() => {
              if (isMobile) openPlaceModal(place.placeId)
              else openPlaceSidePanel(place.placeId)
            }}
          />
        ))}
      </Map>
    </Box>
  )
}