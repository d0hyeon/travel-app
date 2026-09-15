import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import type { SvgIconProps } from '@mui/material';
import type { RouteTransportType } from '@waylog/domains/modules/route';
import { TransportType } from '@waylog/domains/modules/transport';

interface TransportIconProps extends SvgIconProps {
  transport: RouteTransportType;
}

// 이동수단에 맞는 아이콘을 렌더한다 (도보/차량)
export function TransportIcon({ transport, ...props }: TransportIconProps) {
  if (transport === TransportType.도보) return <DirectionsWalkIcon {...props} />;
  return <DirectionsCarIcon {...props} />;
}
