import { Map } from '~shared/components/Map';
import type { Coordinate } from '~shared/components/Map/types';
import { formatDuration } from '~shared/utils/formats';
import { useRoadRoute } from '~features/route/road-route/useRoadRoute';
import { TransportTypeLabel } from '~features/route/route.types';

interface RoutePathProps {
  waypoints: Coordinate[];
  color: string;
  isSelected: boolean;
}

// 경로를 구간(leg)별 폴리라인으로 그리고, 선택된 경로는 구간마다 이동수단·예상시간 라벨을 표시한다.
export function RoutePath({ waypoints, color, isSelected }: RoutePathProps) {
  const { legs } = useRoadRoute({ waypoints });

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
          label={isSelected && leg.duration > 0 ? `${TransportTypeLabel[leg.transport]} ${formatDuration(leg.duration)}` : undefined}
        />
      ))}
    </Map.Polyline>
  );
}
