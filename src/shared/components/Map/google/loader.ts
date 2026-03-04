import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

let promise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (promise) return promise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Google Maps API key is not set (VITE_GOOGLE_MAPS_API_KEY)');
  }

  setOptions({
    key: apiKey ?? '',
    v: 'weekly',
  });

  // maps 라이브러리 로드 (기본 Map 클래스 포함)
  promise = importLibrary('maps').then(() => {});

  return promise;
}
