import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { useMemo } from 'react'
import { useExploredPlaces } from './explorer-ranking/useExploredPlaces'
import { useRecentHotPlaces } from './explorer-recent/useRecentHotPlaces'
import { useMostSavedPlaces } from './explorer-saved/useMostSavedPlaces'
import type { ExploredPlace, MostSavedPlace } from './explorer.api'

interface PlaceFilters {
  location?: Location
  category?: PlaceCategoryType
}

export interface AttentionPlace {
  placeId: string
  name: string
  lat: number
  lng: number
  thumbnailUrl?: string
  score: number
}

export function useAttentionPlaces(filters: PlaceFilters = {}) {
  const { data: visitedPlaces } = useExploredPlaces(filters)
  const { data: hotPlaces } = useRecentHotPlaces(3, filters)
  const { data: savedPlaces } = useMostSavedPlaces(filters)

  return useMemo(() => {
    const scoreEntries = mergeScoreMaps(
      toScoreMap(visitedPlaces, (place) => place.visitorCount, 'visited'),
      toScoreMap(hotPlaces, (place) => place.visitorCount, 'hot'),
      toScoreMap(savedPlaces, (place) => place.saveCount, 'saved'),
    )
    const attentionPlaces = [...scoreEntries.values()].map((entry) => ({
      placeId: entry.placeId,
      name: entry.name,
      lat: entry.lat,
      lng: entry.lng,
      thumbnailUrl: entry.thumbnailUrl,
      score: entry.visited * 0.4 + entry.hot * 0.35 + entry.saved * 0.25,
    }))

    return normalizeAttentionScores(attentionPlaces).toSorted(
      (first, second) => second.score - first.score,
    )
  }, [hotPlaces, savedPlaces, visitedPlaces])
}

interface ScoreEntry {
  placeId: string
  name: string
  lat: number
  lng: number
  thumbnailUrl?: string
  visited: number
  hot: number
  saved: number
}

function toScoreMap<T extends { placeId: string; name: string; lat: number; lng: number; thumbnailUrl?: string }>(
  places: T[],
  getValue: (place: T) => number,
  scoreName: 'visited' | 'hot' | 'saved',
): Map<string, ScoreEntry> {
  const highestValue = Math.max(...places.map(getValue), 1)

  return new Map(
    places.map((place) => [
      place.placeId,
      {
        placeId: place.placeId,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        thumbnailUrl: place.thumbnailUrl,
        visited: scoreName === 'visited' ? getValue(place) / highestValue : 0,
        hot: scoreName === 'hot' ? getValue(place) / highestValue : 0,
        saved: scoreName === 'saved' ? getValue(place) / highestValue : 0,
      },
    ]),
  )
}

function mergeScoreMaps(...maps: Map<string, ScoreEntry>[]): Map<string, ScoreEntry> {
  return maps.reduce((mergedEntries, currentEntries) => {
    currentEntries.forEach((entry, placeId) => {
      const existingEntry = mergedEntries.get(placeId)
      mergedEntries.set(
        placeId,
        existingEntry == null
          ? entry
          : {
              ...existingEntry,
              visited: existingEntry.visited + entry.visited,
              hot: existingEntry.hot + entry.hot,
              saved: existingEntry.saved + entry.saved,
            },
      )
    })
    return mergedEntries
  }, new Map<string, ScoreEntry>())
}

function normalizeAttentionScores(places: AttentionPlace[]): AttentionPlace[] {
  const orderedPlaces = places.toSorted((first, second) => first.score - second.score)
  return places.map((place) => ({
    ...place,
    score:
      orderedPlaces.length <= 1
        ? 0
        : orderedPlaces.findIndex((orderedPlace) => orderedPlace.placeId === place.placeId) /
          (orderedPlaces.length - 1),
  }))
}

export type ExplorerPlace = ExploredPlace | MostSavedPlace
