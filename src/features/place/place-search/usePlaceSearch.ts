import { useState, useCallback, useRef, useEffect } from 'react';
import { loadKakaoMap } from '../../../shared/components/Map/kakao/loader';
import { loadGoogleMaps } from '../../../shared/components/Map/google/loader';
import type { MapType } from '../../../shared/components/Map/types';

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface UsePlaceSearchOptions {
  type: MapType;
  debounceMs?: number;
}

interface UsePlaceSearchReturn {
  search: (query: string) => void;
  results: PlaceResult[];
  isLoading: boolean;
  error: string | null;
  clear: () => void;
}

export function usePlaceSearch({
  type,
  debounceMs = 300,
}: UsePlaceSearchOptions): UsePlaceSearchReturn {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kakaoPlacesRef = useRef<kakao.maps.services.Places | null>(null);
  const googlePlacesRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SDK 초기화
  useEffect(() => {
    if (type === 'kakao') {
      loadKakaoMap().then(() => {
        kakaoPlacesRef.current = new kakao.maps.services.Places();
      });
    } else {
      loadGoogleMaps().then(() => {
        // PlacesService는 map 또는 div element가 필요
        const div = document.createElement('div');
        googlePlacesRef.current = new google.maps.places.PlacesService(div);
      });
    }
  }, [type]);

  const searchKakao = useCallback((query: string) => {
    if (!kakaoPlacesRef.current) return;

    kakaoPlacesRef.current.keywordSearch(query, (data, status) => {
      setIsLoading(false);

      if (status === kakao.maps.services.Status.OK) {
        setResults(
          data.map((item) => ({
            id: item.id,
            name: item.place_name,
            address: item.road_address_name || item.address_name,
            lat: parseFloat(item.y),
            lng: parseFloat(item.x),
          }))
        );
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        setResults([]);
      } else {
        setError('검색 중 오류가 발생했습니다');
      }
    });
  }, []);

  const searchGoogle = useCallback((query: string) => {
    if (!googlePlacesRef.current) return;

    const request: google.maps.places.TextSearchRequest = {
      query,
      language: 'ko',
    };

    googlePlacesRef.current.textSearch(request, (results, status) => {
      setIsLoading(false);

      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setResults(
          results.map((item) => ({
            id: item.place_id ?? crypto.randomUUID(),
            name: item.name ?? '',
            address: item.formatted_address ?? '',
            lat: item.geometry?.location?.lat() ?? 0,
            lng: item.geometry?.location?.lng() ?? 0,
          }))
        );
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        setResults([]);
      } else {
        setError('검색 중 오류가 발생했습니다');
      }
    });
  }, []);

  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!query.trim()) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(() => {
        setIsLoading(true);
        setError(null);

        if (type === 'kakao') {
          searchKakao(query);
        } else {
          searchGoogle(query);
        }
      }, debounceMs);
    },
    [type, debounceMs, searchKakao, searchGoogle]
  );

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  return { search, results, isLoading, error, clear };
}
