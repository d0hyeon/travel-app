import { useQueries } from "@tanstack/react-query";
import { getCoordinateBounds, normalizeCoordsToCanvas, pointsToPath } from "@waylog/domains/modules/community-route";
import { isLocation } from "@waylog/domains/modules/location";
import { getLocationCoordinates } from "@waylog/domains/modules/map";
import { Coordinate } from "@waylog/utility";
import { Fragment, ReactNode } from "react";
import Svg, { Path, Rect } from "react-native-svg";

interface Props {
  location: string | string[];
  width?: number;
  height?: number;
  fillColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  children?: ReactNode;
}

export function LocationThumbnail({
  location,
  width = 140,
  height = 90,
  fillColor = '#dde8f0',
  backgroundColor = '#f0f4f8',
  outlineColor = '#b0c8d8'
}: Props) {
  const locations = Array.isArray(location) ? location : [location];
  const validLocations = locations.filter(isLocation);

  const shapeRingQueries = useQueries({
    queries: validLocations.map((location) => ({
      queryKey: ['location-coordinates', location],
      queryFn: () => getLocationCoordinates({ location }),
      enabled: validLocations.length > 0,
    })),
  })

  const shapeRings = shapeRingQueries.map(x => x.data ?? []);
  const allCoords = shapeRings == null ? [] : shapeRings.flat();
  const bounds = getCoordinateBounds(allCoords.flat())
  const size = { width, height, padding: 6 }

  const toSVG = (coords: Coordinate[]) => normalizeCoordsToCanvas(coords, bounds, size)

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* 배경 */}
      <Rect
        width={width}
        height={height}
        fill={backgroundColor}
      />

      {/* 지역 shape */}
      {shapeRings?.map((shapeRing, i) => (
        <Fragment key={i}>
          {shapeRing.map((ring, x) => (
            <Path
              key={`${i}=${x}`}
              d={pointsToPath(toSVG(ring))}
              fill={fillColor}
              stroke={outlineColor}
              strokeWidth={0.8}
              strokeLinejoin="round"
            />
          ))}

        </Fragment>
      ))}
    </Svg>
  )
}

