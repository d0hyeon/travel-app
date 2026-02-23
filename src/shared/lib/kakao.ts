declare global {
  interface Window {
    kakao: typeof kakao
  }

  namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions)
    setCenter(latlng: LatLng): void
    panTo(latlng: LatLng): void;
    setBounds(bounds: LatLngBounds): void
    getCenter(): LatLng
    getLevel(): number
    setLevel(level: number): void
    relayout(): void;
  }

  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
  }

  class LatLngBounds {
    constructor()
    extend(latlng: LatLng): void
  }

  class Marker {
    constructor(options: MarkerOptions)
    setMap(map: Map | null): void
    getPosition(): LatLng
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions)
    setMap(map: Map | null): void
  }

  class Polyline {
    constructor(options: PolylineOptions)
    setMap(map: Map | null): void
  }

  interface MapOptions {
    center: LatLng
    level?: number
  }

  interface MarkerOptions {
    position: LatLng
    map?: Map
    image?: MarkerImage
  }

  interface CustomOverlayOptions {
    position: LatLng
    content: string | HTMLElement
    map?: Map
    yAnchor?: number
    xAnchor?: number
  }

  interface PolylineOptions {
    path: LatLng[]
    strokeWeight?: number
    strokeColor?: string
    strokeOpacity?: number
    strokeStyle?: string
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: MarkerImageOptions)
  }

  class Size {
    constructor(width: number, height: number)
  }

  interface MarkerImageOptions {
    offset?: Point
  }

  class Point {
    constructor(x: number, y: number)
  }

  namespace event {
    function addListener(target: Marker | Map, type: string, handler: () => void): void
    function removeListener(target: Marker | Map, type: string, handler: () => void): void
  }

  function load(callback: () => void): void
  }

  namespace kakao.maps.services {
    class Places {
      constructor()
      keywordSearch(
        keyword: string,
        callback: (result: PlaceSearchResult[], status: Status) => void,
        options?: PlacesSearchOptions
      ): void
    }

    interface PlaceSearchResult {
      id: string
      place_name: string
      address_name: string
      road_address_name: string
      x: string // longitude
      y: string // latitude
      phone: string
      category_name: string
    }

    interface PlacesSearchOptions {
      location?: kakao.maps.LatLng
      radius?: number
      size?: number
      page?: number
    }

    enum Status {
      OK = 'OK',
      ZERO_RESULT = 'ZERO_RESULT',
      ERROR = 'ERROR',
    }
  }
}

let isLoaded = false;
let promise: Promise<void> | null = null;
export function loadKakaoMap() {
  if (promise == null) {
    promise = new Promise((resolve) => {
      window.kakao.maps.load(() => {
        isLoaded = true;
        resolve()
      })
    })
  }
  
  return promise;
}

export function isKakaoMapLoaded(): boolean {
  return isLoaded
}
