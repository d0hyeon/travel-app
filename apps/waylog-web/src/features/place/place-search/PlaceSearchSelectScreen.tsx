import { Circle } from "@mui/icons-material";
import { Box, Button, Chip, CircularProgress, debounce, ListItemText, Stack, type BoxProps } from "@mui/material";
import { useEffect, useRef, useState, useTransition, type ReactNode, type Ref } from "react";
import { IntersectionArea } from "~shared/components/IntersectionArea";
import { ListItem } from "~shared/components/ListItem";
import { Map, type Coordinate, type MapBounds, type MapRef } from "~shared/components/Map";
import { SplitView, } from "~shared/components/split-view/SplitView";
import { calcDistance } from "@waylog/domains/utils";
import { usePlaceSearch, type PlaceResult } from '@waylog/domains/place';
import { usePreservedValue } from "@waylog/react";

const COLORS = ['#66BB6A', '#EB5757', '#5DADE2', '#7986CB']

const SEARCH_HERE_THRESHOLD_M = 500;

function boundsToCenter(bounds: MapBounds): Coordinate {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  };
}

function isFarEnough(a: Coordinate, b: Coordinate | null): boolean {
  if (b == null) return false;
  return calcDistance(a, b) >= SEARCH_HERE_THRESHOLD_M;
}

interface Props extends Omit<BoxProps, 'onSelect'> {
  keyword?: string;
  onSelect?: (value: PlaceResult) => void | Promise<void>;
  mapServiceProvider?: 'kakao' | 'google';
  center?: Coordinate;
  topNavigation?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const NAVIGATION_HEIGHT = 50;
export function PlaceSearchSelectScreen({
  keyword,
  center,
  mapServiceProvider = 'kakao',
  onSelect,
  topNavigation,
  ref,
  ...boxProps
}: Props) {
  const [searchCenter, setSearchCenter] = useState(center);
  const { data: results, hasNextPage, isFetchingNextPage, fetchNextPage } = usePlaceSearch({
    keyword,
    service: mapServiceProvider,
    location: searchCenter,
  });
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    const [result] = results;
    if (result) {
      mapRef.current?.panTo(result.lat, result.lng, 2);
    }
  }, [keyword])


  const [mapBoundsCenter, setMapBoundsCenter] = useState<Coordinate | null>(null);
  const getLastSearchedCenter = usePreservedValue(mapBoundsCenter);
  const isFarLastSearch = mapBoundsCenter != null && isFarEnough(mapBoundsCenter, getLastSearchedCenter());

  const [isPendingApply, startTransition] = useTransition();

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="60dvh"
      height="100%"
      ref={ref}
      {...boxProps}
    >
      <Stack direction="column" height="100%">
        {topNavigation && (
          <Box flex="0" padding={1} height={NAVIGATION_HEIGHT}>
            {topNavigation}
          </Box>
        )}

        <SplitView
          direction="vertical"
          onResizeEnd={() => mapRef.current?.relayout()}
          height={topNavigation ? `calc(100% - ${NAVIGATION_HEIGHT}px)` : "100%"}
          sx={{ flex: 1 }}
        >
          <Box position="relative" height="100%">
            <Map
              ref={mapRef}
              defaultCenter={center}
              type={mapServiceProvider}
              height="100%"
              autoFocus="marker"
              onBoundsChange={debounce((bounds) => {
                const boundsCenter = boundsToCenter(bounds);
                setMapBoundsCenter(boundsCenter);
              }, 300)}
            >
              {results.map((x, idx) => (
                <Map.Marker lat={x.lat} lng={x.lng} label={x.name} color={COLORS[idx % COLORS.length]} />
              ))}
            </Map>
            {isFarLastSearch && (
              <Box
                position="absolute"
                top={12}
                left="50%"
                sx={{ transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'auto' }}
              >
                <Chip
                  label="이 장소에서 검색"
                  onClick={() => setSearchCenter(mapBoundsCenter!)}
                  color="primary"
                  sx={{ boxShadow: 2, fontWeight: 'medium' }}
                />
              </Box>
            )}
          </Box>
          <Stack gap={1} padding={2} sx={{ overflowY: 'auto', }}>
            {results.map((x, idx) => (
              <ListItem.Button
                key={x.externalId}
                leftAddon={<Circle htmlColor={COLORS[idx % COLORS.length]} sx={{ width: '0.8rem', height: '0.8rem' }} />}
                rightAddon={
                  <Button
                    variant="contained"
                    onClick={() => startTransition(() => onSelect?.(x))}
                    loading={isPendingApply}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    선택
                  </Button>
                }
              >
                <ListItemText
                  primary={x.name}
                  secondary={x.address}
                  primaryTypographyProps={{ fontWeight: 'medium', fontSize: 14 }}
                  secondaryTypographyProps={{ fontSize: 12 }}
                  onClick={() => mapRef.current?.panTo(x.lat, x.lng, 2)}
                />
              </ListItem.Button>
            ))}
            <IntersectionArea onEnter={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}>
              {isFetchingNextPage && (
                <Box display="flex" justifyContent="center" py={1}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </IntersectionArea>
          </Stack>
        </SplitView>
      </Stack>
    </Box>
  )
}
