// 웹 색상에서 채도를 낮추고 명도를 올려, 네이티브 지도 렌더링에서 과하게 쨍해 보이지 않도록 앱 전용으로 조정했다.
export const ROUTE_COLORS = ['#78a4cf', '#da9d9b', '#88b78a', '#deb179', '#ad6bbe', '#4bc3d2'] as const

export function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length]
}
