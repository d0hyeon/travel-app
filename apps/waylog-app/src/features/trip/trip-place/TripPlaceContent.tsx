import { StyleSheet } from 'react-native'
import { Box, Fab, Stack, Typography } from "~/shared/components/design-system";
import { MaterialIcons } from '@expo/vector-icons';
import { palette, zLayer } from "../../../shared/config/tokens";
import { Suspense, useMemo, useRef, useState } from "react";
import { arraySplit } from '@waylog/utility';
import { BottomSheet } from "../../../shared/components/bottom-sheet/BottomSheet";
import { Map, type MapRef } from "../../../shared/components/Map";
import { PlaceCategoryColorCode, type TripPlace } from '@waylog/domains/modules/place';
import { useTripCluastering } from '../hooks/useTripCluastering';
import { useTripRoutes } from '@waylog/domains/modules/trip';
import { useTrip } from "@waylog/domains/modules/trip";
import { useTripPlaceAddition } from './useTripPlaceAddition';
import { RecommendedMarkers } from '../trip-recommend/RecommendedMarkers';
import { useRecommendedPlaceDetailOverlay } from '../trip-recommend/RecommendedPlaceDetailOverlay';
import { TripPlaceItemButton } from './TripPlaceItemButton';
import { TripPlaceMapFloatingControls } from './TripPlaceMapFloatingControls';
import { useTripPlaces } from '@waylog/domains/modules/trip';
import { FLOATING_TAB_BAR_RESERVE } from '../../../shared/components'

// 웹은 zoom 이 커질수록 축소되는 스케일(레벨)을 쓰지만, 앱(deltaToZoom)은 반대로
// zoom 이 커질수록 확대된다. 웹의 MICRO_ZOOM_LEVEL(8, "이 이상 축소되면")과 같은
// 지점을 앱 스케일로 표현하면 "이 미만으로 축소되면"이 된다.
const MICRO_ZOOM_LEVEL = 9;


interface PlaceContentProps {
  tripId: string
}

const BOTTOM_SHEET_RATIOS = [0.25, 0.5, 0.65, 0.8, 1] as const;
const DEFAULT_BOTTOM_SHEET_RATIO = 0.65 satisfies typeof BOTTOM_SHEET_RATIOS[number];

export default function TripPlaceContent({ tripId }: PlaceContentProps) {
  const { data: trip } = useTrip(tripId)
  const { data: places } = useTripPlaces(tripId)
  const { data: { routes } } = useTripRoutes(tripId)
  const { addPlace } = useTripPlaceAddition(tripId)

  const mapRef = useRef<MapRef>(null);
  const { openBottomSheet } = useRecommendedPlaceDetailOverlay()
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

  const handleAddPlace = async () => {
    const added = await addPlace()
    if (added == null) return

    setFocusedId(added.id)
    mapRef.current?.panTo(added.lat, added.lng, 5)
  }

  return (
    <>
      <Box style={styles.container}>
        <TripPlaceMapFloatingControls />
        {/* Map (전체) */}
        {/* 웹은 calc(%-10px) 를 쓰지만 RN 은 계산식을 못 읽는다. 비율만 남긴다. */}
        <Box
          style={[styles.mapArea, { bottom: `${sheetRatio * 100}%` }]}
        >
          <Map
            ref={mapRef}
            defaultCenter={{ lat: trip.lat, lng: trip.lng }}
            clustering={isCluastering}
            clusterGridSize={50}
            autoFocus="marker"
          >
            {({ zoom }) => (
              <>
                {places.map(place => (
                  <Map.Marker
                    key={place.id}
                    label={zoom < MICRO_ZOOM_LEVEL ? undefined : place.name}
                    lat={place.lat}
                    lng={place.lng}
                    color={place.category
                      ? PlaceCategoryColorCode[place.category]
                      : plannedPlaceIds.has(place.id) ? 'selected' : 'default'
                    }
                    variant={zoom < MICRO_ZOOM_LEVEL ? 'circle' : 'pin'}
                    onPress={() => setFocusedId(place.id)}
                  />
                ))}

                {zoom >= MICRO_ZOOM_LEVEL && (
                  <Suspense>
                    <RecommendedMarkers
                      tripId={tripId}
                      onPress={(place) => openBottomSheet({ place, tripId })}
                    />
                  </Suspense>
                )}
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
          <BottomSheet.Body>
            <BottomSheet.ScrollView contentContainerStyle={styles.listContent}>
              <Typography variant="caption" color="text.secondary" style={styles.listHeading}>
                계획 ({plannedPlaces.length}) / 후보 ({candidatePlaces.length})
              </Typography>

              <Stack gap={0.75}>
                {plannedPlaces.map((place) => (
                  <TripPlaceItemButton
                    key={place.id}
                    place={place}
                    onPress={() => handlePlaceClick(place)}
                    focused={place.id === focusedId}
                    style={styles.selectedPlace}
                  />
                ))}
                {candidatePlaces.map((place) => (
                  <TripPlaceItemButton
                    key={place.id}
                    place={place}
                    onPress={() => handlePlaceClick(place)}
                    focused={place.id === focusedId}
                  />
                ))}
              </Stack>
            </BottomSheet.ScrollView>
          </BottomSheet.Body>
        </BottomSheet>

        <Box pointerEvents="box-none" style={[styles.fabArea, { bottom: `${sheetRatio * 100}%` }]}>
          <Fab accessibilityLabel="장소 추가" onPress={handleAddPlace} style={styles.addPlaceButton}>
            <MaterialIcons name="add" size={26} color={palette.background} />
          </Fab>
        </Box>
      </Box>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', overflow: 'hidden' },
  mapArea: { position: 'absolute', top: 0, left: 0, right: 0 },
  fabArea: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: zLayer.mapFab },
  addPlaceButton: { position: 'absolute', bottom: 16, right: 16, width: 52, height: 52, borderRadius: 26 },
  listContent: { paddingHorizontal: 12, paddingBottom: 40 + FLOATING_TAB_BAR_RESERVE },
  listHeading: { marginBottom: 12 },
  selectedPlace: { borderColor: palette.primary },
})
