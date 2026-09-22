import { MaterialIcons } from '@expo/vector-icons'
import { TransportType } from '@waylog/domains/modules/transport'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { ComponentProps } from 'react'

interface Props extends Omit<ComponentProps<typeof MaterialIcons>, 'name'> {
  type: TripTransportType
  size?: number
  color?: string
}

export function TransportTypeIcon({ type, size = 16, color = '#787c7e', ...props }: Props) {
  const name =
    type === TransportType.항공
      ? 'flight'
      : type === TransportType.기차
        ? 'train'
        : 'directions-bus'

  return <MaterialIcons name={name} size={size} color={color} {...props} />
}
