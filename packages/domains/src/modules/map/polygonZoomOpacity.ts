export type RegionPolygonKind = "region" | "country";

const REGION_VISIBLE_MIN_ZOOM = 3;

function getCountryOpacityMultiplier(zoom: number) {
  if (zoom >= 7) return 0.4;
  if (zoom >= 6) return 0.55;
  if (zoom >= 5) return 0.7;
  if (zoom >= 4) return 0.75;
  if (zoom >= 3) return 0.9;

  return 1;
}

interface GetRegionPolygonPaintParams {
  kind: RegionPolygonKind;
  zoom: number;
  /** 방문 횟수로 정한 기본 진하기 */
  opacity: number;
}

export interface RegionPolygonPaint {
  isVisible: boolean;
  fillOpacity: number;
  lineOpacity: number;
  lineWidth: number;
  /** 지역이 나라를 덮도록 하는 그리기 순서 */
  sortKey: number;
}

const HIDDEN_OPACITY = 0.01;

/** 최소 줌에서는 국가만 보이다가, 확대하면 지역이 나타나며 국가 채움은 뒤로 물러난다. */
export function getRegionPolygonPaint({
  kind,
  zoom,
  opacity,
}: GetRegionPolygonPaintParams): RegionPolygonPaint {
  if (kind === "region") {
    const isZoomedOutBeforeRegionView = zoom < REGION_VISIBLE_MIN_ZOOM;

    return {
      isVisible: !isZoomedOutBeforeRegionView && opacity > HIDDEN_OPACITY,
      fillOpacity: opacity,
      lineOpacity: Math.min(0.36, opacity + 0.08),
      lineWidth: zoom >= 8 ? 1.4 : 1,
      sortKey: 3,
    };
  }

  const fillOpacity = opacity * getCountryOpacityMultiplier(zoom);

  return {
    isVisible: fillOpacity > HIDDEN_OPACITY,
    fillOpacity,
    lineOpacity: Math.max(0.08, Math.min(0.24, fillOpacity + 0.06)),
    lineWidth: 1,
    sortKey: 1,
  };
}
