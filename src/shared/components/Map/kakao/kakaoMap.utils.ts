import { ZOOM_SCALE_CONFIG } from "../map.constants";
import { resolveMarkerColor } from "../map.utils";
import type { MarkerColor, MarkerProps } from "../types";

export { resolveMarkerColor };

export function createLabelContent(
  label: string,
  variant?: MarkerProps['variant'],
  color?: MarkerColor,
  opacity = 1,
  level: number = 8
): string {
  const bg = resolveMarkerColor(color, variant);
  const scale = getZoomScale(level);
  const fontSize = Math.round(11 * scale);
  const paddingV = Math.round(2 * scale);
  const paddingH = Math.round(6 * scale);

  return `
    <div style="
      background: ${bg};
      color: white;
      padding: ${paddingV}px ${paddingH}px;
      border-radius: 10px;
      font-size: ${fontSize}px;
      font-weight: bold;
      white-space: nowrap;
      opacity: ${opacity};
    ">${label}</div>
  `
}

export function getZoomScale(level: number = 8): number {
  const { BASE_LEVEL, MIN_SCALE, MAX_SCALE, RATE } = ZOOM_SCALE_CONFIG;
  const scale = 1 + (BASE_LEVEL - level) * RATE;
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
}

export function getMarkerImage(
  variant?: MarkerProps['variant'],
  color?: MarkerColor,
  opacity = 1,
  level: number = 8,
): kakao.maps.MarkerImage | undefined {
  const scale = getZoomScale(level);
  const resolvedColor = resolveMarkerColor(color, variant);

  if (variant === 'circle') {
    const size = 20 * scale;
    const svgCircle = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" fill="${resolvedColor}" fill-opacity="${opacity}" stroke="white" stroke-width="4.5"/>      
      <circle cx="8" cy="8" r="6" fill="none" stroke="${resolvedColor}" fill-opacity="${opacity}" stroke-width="1" />
    </svg>
    `;
    
    const encodedSvg = encodeURIComponent(svgCircle);
    const dataUrl = `data:image/svg+xml,${encodedSvg}`;
    return new kakao.maps.MarkerImage(
      dataUrl,
      new kakao.maps.Size(size, size),
      { offset: new kakao.maps.Point(size / 2, size / 2) }
    );
  }

  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="30" viewBox="0 0 20 30">
      <path fill="${resolvedColor}" fill-opacity="${opacity}" d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.5-4.5-10-10-10z"/>
      <circle fill="white" fill-opacity="${opacity}" cx="10" cy="10" r="4"/>
    </svg>
  `;
  const encodedSvg = encodeURIComponent(svgMarker);
  const dataUrl = `data:image/svg+xml,${encodedSvg}`;

  return new kakao.maps.MarkerImage(
    dataUrl,
    new kakao.maps.Size(20 * scale, 30 * scale),
    { offset: new kakao.maps.Point(10 * scale, 30 * scale) }
  );
}
