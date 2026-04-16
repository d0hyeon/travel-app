import { useQuery } from '@tanstack/react-query';
import { use, useMemo, useRef } from 'react';
import { type Coordinate } from '~shared/model/coordinate.model';
import { assert } from '~shared/utils/types';
import { loadGoogleMaps } from '../../../shared/components/Map/google/loader';
import { loadKakaoMap } from '../../../shared/components/Map/kakao/loader';
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
  location?: Coordinate;
  keyword?: string;
}


export function usePlaceSearch({ type, keyword, location }: UsePlaceSearchOptions) {
  use(type === 'google' ? loadGoogleMaps() : loadKakaoMap());
  
  const div = useMemo(() => document.createElement('div'), []);
  const kakaoServiceRef = useRef(type === 'kakao' ? new kakao.maps.services.Places() : null);
  const googleServiceRef = useRef(type === 'google' ? new google.maps.places.PlacesService(div) : null);

  const { data = [], ...query } = useQuery({
    queryKey: ['place-search', keyword],
    queryFn: () => {
      if (type === 'google') {
        return searchGoogle(keyword!);
      }
      return searchKakao(keyword!)
    },
    enabled: !!keyword
  })


  const searchKakao = async (query: string) => {
    const service = kakaoServiceRef.current;
    assert(!!service, '잘못된 호출입니다.');

    return new Promise<PlaceResult[]>((resolve, reject) => {
      const options = location
        ? { location: new kakao.maps.LatLng(location.lat, location.lng) }
        : {}
      service.keywordSearch(query, (data, status) => {
        if (status === kakao.maps.services.Status.ERROR) {
          return reject(status)
        }
        if (status === kakao.maps.services.Status.ZERO_RESULT) {
          return resolve([]);
        }
        const results = data.map((item) => ({
          id: item.id,
          name: item.place_name,
          address: item.road_address_name || item.address_name,
          lat: parseFloat(item.y),
          lng: parseFloat(item.x),
        }))
        resolve(results);
      }, options);
    })
  };

  const searchGoogle = async (query: string) => {
    const service = googleServiceRef.current;
    assert(!!service, '잘못된 호출입니다.');

    return new Promise<PlaceResult[]>((resolve, reject) => {
      const request: google.maps.places.TextSearchRequest = {
        query,
        language: 'ko',
        location,
      };
      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          return resolve(
            results.map((item) => ({
              id: item.place_id ?? crypto.randomUUID(),
              name: item.name ?? '',
              address: item.formatted_address ?? '',
              lat: item.geometry?.location?.lat() ?? 0,
              lng: item.geometry?.location?.lng() ?? 0,
            }))
          );
        }
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          return resolve([]);
        }
        reject(status)
      });
    })
  };

  

  return { data, ...query }
}
