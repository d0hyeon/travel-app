import { useRoadRoute } from "~features/route/road-route/useRoadRoute"
import { Map } from "~shared/components/Map"

export const ROUTE_COLORS = [
  '#1976d2',
  '#e53935',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00acc1',
] as const

export function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length]
}

interface RoutePathProps {
  waypoints: { lat: number; lng: number }[]
  color: string
  isActive: boolean
}

export function RoutePath({ waypoints, color, isActive }: RoutePathProps) {
  const { data: { coordinates } } = useRoadRoute({ waypoints })

  if (!coordinates || coordinates.length < 2) return null

  return (
    <Map.Path
      coordinates={coordinates}
      strokeColor={color}
      strokeWeight={isActive ? 5 : 3}
      strokeOpacity={isActive ? 1 : 0.4}
    />
  )
}
