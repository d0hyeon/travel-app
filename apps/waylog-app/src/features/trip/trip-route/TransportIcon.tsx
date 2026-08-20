import { MaterialIcons } from '@expo/vector-icons'
import { TransportType, type TransportType as Transport } from '@waylog/domains/route'

interface TransportIconProps {
  transport: Transport
  size?: number
  color?: string
}

// 이동수단에 맞는 아이콘을 렌더한다 (도보/차량)
export function TransportIcon({ transport, size = 14, color = '#787c7e' }: TransportIconProps) {
  const name = transport === TransportType.도보 ? 'directions-walk' : 'directions-car'

  return <MaterialIcons name={name} size={size} color={color} />
}
