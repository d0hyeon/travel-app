import { Map } from '~shared/components/Map';
import type { Coordinate } from '~shared/components/Map/types';
import { formatDuration } from '@waylog/utility';
import { useRoadRoute } from '~features/route/road-route/useRoadRoute';
import { TransportTypeLabel } from '@waylog/domains/modules/transport';
import { useMapZoomLevel } from '~shared/components/Map';
import { useTripViewConfigValue } from '../useTripViewConfig';

interface RoutePathProps {
  waypoints: Coordinate[];
  color: string;
  isSelected: boolean;
}

const SCALED_UP_ZOOM_THRESHOLD = 12; // 기존 카카오 level < 10 과 동일한 확대 정도

// 경로를 구간(leg)별 폴리라인으로 그리고, 선택된 경로는 구간마다 이동수단·예상시간 라벨을 표시한다.
export function RoutePath({ waypoints, color, isSelected }: RoutePathProps) {
  const { data: { legs } } = useRoadRoute({ waypoints, suspense: false });
  const { isVisibleRouteLegs } = useTripViewConfigValue();

  const zoom = useMapZoomLevel();
  const isScaledUpViewport = zoom > SCALED_UP_ZOOM_THRESHOLD;
  const isVisibleLegLabel = isVisibleRouteLegs && isSelected && isScaledUpViewport;

  if (legs.length === 0) return null;

  return (
    <Map.Polyline
      strokeColor={color}
      strokeWeight={isSelected ? 5 : 3}
      strokeOpacity={isSelected ? 1 : 0.6}
    >
      {legs.map((leg, index) => (
        <Map.Polyline.Line
          key={index}
          coordinates={leg.coordinates}
          label={isVisibleLegLabel ? `${index + 1}. ${TransportTypeLabel[leg.transport]} ${formatDuration(leg.duration)}` : undefined}
        />
      ))}
    </Map.Polyline>
  );
}
