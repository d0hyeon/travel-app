import { Circle } from "@mui/icons-material";
import { Box, Button, Chip, CircularProgress, ListItemText, Stack, type BoxProps } from "@mui/material";
import { useEffect, useRef, useState, useTransition, type ReactNode, type Ref } from "react";
import { IntersectionArea } from "~shared/components/IntersectionArea";
import { ListItem } from "~shared/components/ListItem";
import { Map, type Coordinate, type MapBounds, type MapRef } from "~shared/components/Map";
import { ResizeHandleVertical, useResizableSplit } from "~shared/hooks/dom/useResizableSplit";
import { calcDistance } from "~shared/utils/geo";
import { usePlaceSearch, type PlaceResult } from "./usePlaceSearch";

const COLORS = ['#66BB6A', '#EB5757', '#5DADE2', '#7986CB']

const SEARCH_HERE_THRESHOLD_M = 500;

function boundsToCenter(bounds: MapBounds): Coordinate {
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  };
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
  const [mapCenter, setMapCenter] = useState<Coordinate | null>(null);

  const showSearchHere = mapCenter != null && (
    searchCenter == null ||
    calcDistance(mapCenter, searchCenter) >= SEARCH_HERE_THRESHOLD_M
  );

  const { data: results, hasNextPage, isFetchingNextPage, fetchNextPage } = usePlaceSearch({
    keyword,
    type: mapServiceProvider,
    location: searchCenter,
  });
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    const [result] = results;
    if (result) mapRef.current?.panTo(result.lat, result.lng);
  }, [results])

  const handleBoundsChange = (bounds: MapBounds) => {
    setMapCenter(boundsToCenter(bounds));
  };

  const handleSearchHere = () => {
    setSearchCenter(mapCenter!);
  };

  const { containerRef, handleProps, ratio } = useResizableSplit({
    direction: 'vertical',
    onResizeEnd: () => mapRef.current?.relayout(),
  });
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

        <Stack
          direction="column"
          flex="1"
          height={topNavigation ? `calc(100% - ${NAVIGATION_HEIGHT}px)` : "100%"}
          ref={containerRef}
        >
          <Box position="relative" height={`${ratio}%`} flex="1">
            <Map
              ref={mapRef}
              defaultCenter={center}
              type={mapServiceProvider}
              height="100%"
              autoFocus="marker"
              onBoundsChange={handleBoundsChange}
            >
              {results.map((x, idx) => (
                <Map.Marker lat={x.lat} lng={x.lng} label={x.name} color={COLORS[idx % COLORS.length]} />
              ))}
            </Map>
            {showSearchHere && (
              <Box
                position="absolute"
                top={12}
                left="50%"
                sx={{ transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'auto' }}
              >
                <Chip
                  label="이 장소에서 검색"
                  onClick={handleSearchHere}
                  color="primary"
                  sx={{ boxShadow: 2, fontWeight: 'medium' }}
                />
              </Box>
            )}
          </Box>
          <ResizeHandleVertical sx={{ height: 16 }} {...handleProps} />
          <Stack gap={1} padding={2} height={`${100 - ratio}%`} sx={{ overflowY: 'auto', }}>
            {results.map((x, idx) => (
              <ListItem.Button
                key={x.id}
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
        </Stack>
      </Stack>
    </Box>
  )
}
