import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { Box, Button, Stack, ToggleButton, Typography } from "@mui/material";
import { useMemo, useRef, useState } from "react";
import { BottomArea } from '~shared/components/BottomArea';
import { useQueryParamState } from '~shared/hooks/useQueryParamState';
import { BottomSheet } from "../../../shared/components/BottomSheet";
import { KakaoMap, type KakaoMapRef } from "../../../shared/components/KakaoMap";
import { usePlaceSearchBottomSheet } from '../../place/place-search/usePlaceSearchBottomSheet';
import { PlaceCategoryColorCode, type Place } from "../../place/place.types";
import { useTripRoutes } from "../trip-route/useTripRoutes";
import { TripPlaceItemButton } from './TripPlaceItemButton';
import { useTripPlaces } from "./useTripPlaces";

interface PlaceContentProps {
  tripId: string
  defaultCenter: { lat: number; lng: number }
}

const BOTTOM_SHEET_RATIOS = [0.25, 0.5, 0.8, 1] as const;
const DEFAULT_BOTTOM_SHEET_RATIO = 0.5 satisfies typeof BOTTOM_SHEET_RATIOS[number];

export function TripPlaceContent({ tripId, defaultCenter }: PlaceContentProps) {
  const { data: places, create } = useTripPlaces(tripId)
  const { data: { routes } } = useTripRoutes(tripId)


  const mapRef = useRef<KakaoMapRef>(null);
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

  const [cluastering, setCluastering] = useQueryParamState('cluaster', {
    defaultValue: false,
    parse: value => value === 'true'
  })
  const [sheetRatio, setSheetRatio] = useState(DEFAULT_BOTTOM_SHEET_RATIO);

  const { searchPlace } = usePlaceSearchBottomSheet();
  const [focusedId, setFocusedId] = useState<string | null>(null)

  return (
    <>
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Stack gap={1} padding={1} position="absolute" top={0} right={0} zIndex={8}>
          <ToggleButton
            value="check"
            selected={cluastering}
            onChange={() => setCluastering(!cluastering)}
            size="small"
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
          >
            <WorkspacesIcon />
          </ToggleButton>
        </Stack>
        {/* Map (전체) */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `calc(${sheetRatio * 100}% - 10px)` }}>
          <KakaoMap
            ref={mapRef}
            defaultCenter={defaultCenter}
            height="100%"
            clustering={cluastering}
            clusterGridSize={50}
          >
            {places.map(place => (
              <KakaoMap.Marker
                key={place.id}
                variant={confirmedPlaceIds.has(place.id) ? 'selected' : 'default'}
                label={place.name}
                lat={place.lat}
                lng={place.lng}
                color={place.category ? PlaceCategoryColorCode[place.category] : undefined}
                onClick={() => setFocusedId(place.id)}
              />
            ))}
          </KakaoMap>
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
      <BottomArea position="relative">
        <Button
          size="large"
          variant="contained"
          onClick={async () => {
            const place = await searchPlace();
            if (place == null) return;
            create(place)
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
