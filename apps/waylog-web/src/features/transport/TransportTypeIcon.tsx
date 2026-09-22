import DirectionsBusIcon from '@mui/icons-material/DirectionsBus'
import FlightIcon from '@mui/icons-material/Flight'
import TrainIcon from '@mui/icons-material/Train'
import type { SvgIconProps } from '@mui/material'
import { TransportType } from '@waylog/domains/modules/transport'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'

interface Props extends SvgIconProps {
  type: TripTransportType
}

export function TransportTypeIcon({ type, ...props }: Props) {
  if (type === TransportType.항공) return <FlightIcon {...props} />
  if (type === TransportType.기차) return <TrainIcon {...props} />
  return <DirectionsBusIcon {...props} />
}
