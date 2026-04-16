import { Circle } from "@mui/icons-material";
import { Box, Button, ListItemText, Stack, type BoxProps } from "@mui/material";
import { useEffect, useRef, useTransition, type ReactNode, type Ref } from "react";
import { ListItem } from "~shared/components/ListItem";
import { Map, type Coordinate, type MapRef } from "~shared/components/Map";
import { ResizeHandleVertical, useResizableSplit } from "~shared/hooks/dom/useResizableSplit";
import { usePlaceSearch, type PlaceResult } from "./usePlaceSearch";

const COLORS = ['#66BB6A', '#EB5757', '#5DADE2', '#7986CB']

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
  const { data: results } = usePlaceSearch({ keyword, type: mapServiceProvider, location: center });
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    const [result] = results;
    if (result) mapRef.current?.panTo(result.lat, result.lng);
  }, [results])

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
          <Map
            ref={mapRef}
            defaultCenter={center}
            type={mapServiceProvider}
            height={`${ratio}%`}
            autoFocus="marker"
            flex="1"
          >
            {results.map((x, idx) => (
              <Map.Marker lat={x.lat} lng={x.lng} label={x.name} color={COLORS[idx % COLORS.length]} />
            ))}
          </Map>
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
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}