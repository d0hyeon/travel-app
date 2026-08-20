import { Box, Stack, Typography } from "../../../shared/components/mui";
import { palette } from "../../../shared/config/tokens";
import { Suspense, useMemo, useRef, useState } from "react";
import { BottomArea } from '../../../shared/components/BottomArea';
import { arraySplit } from '@waylog/domains/utils';
import { BottomSheet } from "../../../shared/components/bottom-sheet/BottomSheet";
import { Map, type MapRef } from "../../../shared/components/Map";
import { PlaceCategoryColorCode, type TripPlace } from '@waylog/domains/place';
import { useTripCluastering } from '../hooks/useTripCluastering';
import { useTripRoutes } from '@waylog/domains/trip';
import { useTrip } from "@waylog/domains/trip";
import { TripPlaceAdditionButton } from './TripPlaceAdditionButton';
import { TripPlaceItemButton } from './TripPlaceItemButton';
import { TripPlaceMapFloatingControls } from './TripPlaceMapFloatingControls';
import { useTripPlaces } from '@waylog/domains/trip';

const MICRO_ZOOM_LEVEL = 8;


interface PlaceContentProps {
  tripId: string
}

const BOTTOM_SHEET_RATIOS = [0.25, 0.5, 0.8, 1] as const;
const DEFAULT_BOTTOM_SHEET_RATIO = 0.5 satisfies typeof BOTTOM_SHEET_RATIOS[number];

export default function TripPlaceContent({ tripId }: PlaceContentProps) {
  const { data: trip } = useTrip(tripId)
  const { data: places } = useTripPlaces(tripId)
  const { data: { routes } } = useTripRoutes(tripId)

  const mapRef = useRef<MapRef>(null);
  const handlePlaceClick = (place: TripPlace) => {
    mapRef.current?.panTo(place.lat, place.lng)
  }

  const plannedPlaceIds = useMemo(() => new Set(routes.flatMap(route => route.placeIds)), [routes])
  const [plannedPlaces, candidatePlaces] = useMemo(() => (
    arraySplit(places, place => plannedPlaceIds.has(place.id))
  ), [places, plannedPlaceIds])

  const [isCluastering] = useTripCluastering();
  const [sheetRatio, setSheetRatio] = useState(DEFAULT_BOTTOM_SHEET_RATIO);

  const [focusedId, setFocusedId] = useState<string | null>(null)

  return (
    <>
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TripPlaceMapFloatingControls />
        {/* Map (전체) */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `calc(${sheetRatio * 100}% - 10px)` }}>
          <Map
            type={trip.isOverseas ? 'google' : 'kakao'}
            ref={mapRef}
            defaultCenter={{ lat: trip.lat, lng: trip.lng }}
            clustering={isCluastering}
            clusterGridSize={50}
          >
            {({ zoom }) => (
              <>
                {places.map(place => (
                  <Map.Marker
                    key={place.id}
                    label={zoom > MICRO_ZOOM_LEVEL ? undefined : place.name}
                    lat={place.lat}
                    lng={place.lng}
                    color={place.category
                      ? PlaceCategoryColorCode[place.category]
                      : plannedPlaceIds.has(place.id) ? 'selected' : 'default'
                    }
                    variant={zoom > MICRO_ZOOM_LEVEL ? 'circle' : 'pin'}
                    onClick={() => setFocusedId(place.id)}
                  />
                ))}

                {/* 추천 마커(trip-recommend)는 2단계 범위다 */}
              </>
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
          <BottomSheet.Body sx={{ paddingBottom: 40 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              확정 ({plannedPlaces.length}) / 후보 ({candidatePlaces.length})
            </Typography>

            <Stack gap={0.75}>
              {plannedPlaces.map((place) => (
                <TripPlaceItemButton
                  key={place.id}
                  place={place}
                  onClick={() => handlePlaceClick(place)}
                  focused={place.id === focusedId}
                  sx={{ borderColor: palette.primary }}
                />
              ))}
              {candidatePlaces.map((place) => (
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
        <TripPlaceAdditionButton
          tripId={tripId}
          onAddedPlace={(place) => {
            setFocusedId(place.id)
            mapRef.current?.panTo(place.lat, place.lng, 5);
          }}
          size="large"
          variant="contained"
          fullWidth
        />
      </BottomArea>
    </>
  )
}


// function calcMarkerZoomThreshold(places: { lat: number; lng: number }[]): number {
//   if (places.length < 2) return 8;

//   const centerLat = places.reduce((s, p) => s + p.lat, 0) / places.length;
//   const centerLng = places.reduce((s, p) => s + p.lng, 0) / places.length;
//   const center = { lat: centerLat, lng: centerLng };

//   const maxDist = Math.max(...places.map(p => calcDistance(center, p)));
//   const base = (() => {
//     if (maxDist > 200_000) return 4;
//     if (maxDist > 80_000) return 5;
//     if (maxDist > 25_000) return 6;
//     if (maxDist > 8_000) return 7;
//     return 8;
//   })()

//   // 장소가 밀집될수록 더 당겨야 라벨이 보이도록 임계값을 낮춤
//   const densityPenalty = Math.floor(Math.log2(places.length / 3));

//   return Math.max(3, base - densityPenalty);
// }