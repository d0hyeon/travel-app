import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { Box, Button, Stack, ToggleButton, Typography } from "@mui/material";
import { Suspense, useMemo, useRef, useState } from "react";
import { BottomArea } from '~shared/components/BottomArea';
import { BottomSheet } from "../../../shared/components/bottom-sheet/BottomSheet";
import { Map, type MapBounds, type MapRef } from "../../../shared/components/Map";
import { usePlaceSearchBottomSheet } from '../../place/place-search/usePlaceSearchBottomSheet';
import { PlaceCategoryColorCode, type Place } from "../../place/place.types";
import { useTripCluastering } from '../hooks/useTripCluastering';
import { useTripRoutes } from "../trip-route/useTripRoutes";
import { useTrip } from "../useTrip";
import { RecommendedMarkers } from './RecommendedPlaceBrowser';
import { useRecommendedPlaceDetailOverlay } from './RecommendedPlaceDetailOverlay';
import { TripPlaceItemButton } from './TripPlaceItemButton';
import { useTripPlaces } from "./useTripPlaces";

const ZOOM_THRESHOLD = 0.2

interface PlaceContentProps {
  tripId: string
}

const BOTTOM_SHEET_RATIOS = [0.25, 0.5, 0.8, 1] as const;
const DEFAULT_BOTTOM_SHEET_RATIO = 0.5 satisfies typeof BOTTOM_SHEET_RATIOS[number];

export function preload(id: string) {
  useTripPlaces.prefetch(id);
  useTripRoutes.prefetch(id);
}

export default function TripPlaceContent({ tripId }: PlaceContentProps) {
  const { data: trip } = useTrip(tripId)
  const { data: places, create } = useTripPlaces(tripId)
  const { data: { routes } } = useTripRoutes(tripId)

  const mapRef = useRef<MapRef>(null);
  const mapType = trip.isOverseas ? 'google' : 'kakao'
  const handlePlaceClick = (place: Place) => {
    mapRef.current?.panTo(place.lat, place.lng)
  }

  const confirmedPlaceIds = useMemo(() => {
    const ids = new Set<string>()
    routes.forEach((route) => {
      route.placeIds.forEach((id) => ids.add(id))
    })
    return ids
  }, [routes])

  const confirmedPlaces = places.filter((p) => confirmedPlaceIds.has(p.id))
  const wishedPlaces = places.filter((p) => !confirmedPlaceIds.has(p.id))

  const [cluastering, setCluastering] = useTripCluastering();
  const [sheetRatio, setSheetRatio] = useState(DEFAULT_BOTTOM_SHEET_RATIO);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)

  const { searchPlace } = usePlaceSearchBottomSheet({ mapType, center: { lat: trip.lat, lng: trip.lng } });
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const { openBottomSheet: openRecommendedSheet } = useRecommendedPlaceDetailOverlay()

  const isZoomedEnough = mapBounds ? Math.abs(mapBounds.north - mapBounds.south) < ZOOM_THRESHOLD : false

  return (
    <>
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Stack gap={1} padding={1} position="absolute" top={0} right={0} zIndex={8}>
          <ToggleButton
            value="check"
            selected={cluastering}
            onChange={() => setCluastering(!cluastering)}
            size="small"
            color="primary"
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7) !important' }}
          >
            <WorkspacesIcon />
          </ToggleButton>
        </Stack>
        {/* Map (전체) */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `calc(${sheetRatio * 100}% - 10px)` }}>
          <Map
            type={mapType}
            ref={mapRef}
            defaultCenter={{ lat: trip.lat, lng: trip.lng }}
            height="100%"
            clustering={cluastering}
            clusterGridSize={50}
            onBoundsChange={setMapBounds}
          >
            {places.map(place => (
              <Map.Marker
                key={place.id}
                label={place.name}
                lat={place.lat}
                lng={place.lng}
                color={place.category
                  ? PlaceCategoryColorCode[place.category]
                  : confirmedPlaceIds.has(place.id) ? 'selected' : 'default'
                }
                onClick={() => setFocusedId(place.id)}
              />
            ))}
            {isZoomedEnough && (
              <Suspense>
                <RecommendedMarkers
                  tripId={tripId}
                  bounds={mapBounds}
                  selectedPlaceId={null}
                  onSelect={() => { }}
                  onOpen={(place) => openRecommendedSheet({ place, tripId })}
                />
              </Suspense>
            )}
          </Map>
        </Box>

        {/* Bottom Sheet */}
        <BottomSheet
          snapPoints={BOTTOM_SHEET_RATIOS}
          defaultSnapIndex={BOTTOM_SHEET_RATIOS.indexOf(DEFAULT_BOTTOM_SHEET_RATIO)}
          onSnapChange={(ratio) => {
            if (ratio < 1 && ratio !== sheetRatio) {
              setSheetRatio(ratio)
              setTimeout(() => mapRef.current?.relayout(), 350)
            }
          }}
        >
          <BottomSheet.Body paddingBottom={5} sx={{ scrollBehavior: 'smooth' }}>
            <Typography variant="caption" color="text.secondary" fontWeight="medium" mb={0.5} display="block">
              확정 ({confirmedPlaces.length}) / 후보 ({wishedPlaces.length})
            </Typography>

            <Stack spacing={0.75}>
              {confirmedPlaces.map((place) => (
                <TripPlaceItemButton
                  key={place.id}
                  place={place}
                  onClick={() => handlePlaceClick(place)}
                  focused={place.id === focusedId}
                  borderColor={theme => theme.palette.primary.main}
                />
              ))}
              {wishedPlaces.map((place) => (
                <TripPlaceItemButton
                  key={place.id}
                  place={place}
                  onClick={() => handlePlaceClick(place)}
                  focused={place.id === focusedId}
                />
              ))}
            </Stack>
          </BottomSheet.Body>
        </BottomSheet>
      </Box>
      <BottomArea position="static">
        <Button
          size="large"
          variant="contained"
          onClick={async () => {
            const place = await searchPlace();
            if (place == null) return;
            const { id } = await create(place);
            setFocusedId(id)
            mapRef.current?.panTo(place.lat, place.lng, 5);
          }}
          sx={{ fontSize: 12 }}
          fullWidth
        >
          장소 추가
        </Button>
      </BottomArea>
    </>
  )
}
