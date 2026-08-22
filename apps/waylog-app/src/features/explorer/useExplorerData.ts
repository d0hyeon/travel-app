import { useSuspenseQuery } from '@tanstack/react-query'
import type { Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { useMemo } from 'react'
import {
  explorerKey,
  getExploredPlaces,
  getMostSavedPlaces,
  type ExploredPlace,
  type MostSavedPlace,
} from './explorer.api'

interface PlaceFilters {
  location?: Location
  category?: PlaceCategoryType
}

export function useExploredPlaces(filters: PlaceFilters = {}) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'explored'],
    queryFn: () => getExploredPlaces(),
  })

  const places = useMemo(() => {
    const highestVisitorCount = Math.max(...query.data.map((place) => place.visitorCount), 0)
    const minimumVisitorCount = highestVisitorCount / 2

    return query.data
      .filter((place) => place.visitorCount >= minimumVisitorCount)
      .filter((place) => !filters.location || place.destinations.includes(filters.location))
      .filter((place) => !filters.category || place.categories.includes(filters.category))
      .toSorted((first, second) => second.visitorCount - first.visitorCount)
  }, [filters.category, filters.location, query.data])

  return { ...query, data: places }
}

export function useRecentHotPlaces(months: number, filters: PlaceFilters = {}) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'recent-hot', months],
    queryFn: () => getExploredPlaces(getSinceDate(months)),
  })

  const places = useMemo(() => {
    const highestScore = Math.max(...query.data.map((place) => place.score), 0)
    const minimumScore = highestScore / 2

    return query.data
      .filter((place) => place.score >= minimumScore)
      .filter((place) => !filters.location || place.destinations.includes(filters.location))
      .filter((place) => !filters.category || place.categories.includes(filters.category))
      .toSorted((first, second) => second.score - first.score)
  }, [filters.category, filters.location, query.data])

  return { ...query, data: places }
}

export function useMostSavedPlaces(filters: PlaceFilters = {}) {
  const query = useSuspenseQuery({
    queryKey: [explorerKey, 'most-saved'],
    queryFn: getMostSavedPlaces,
  })

  const places = useMemo(() => {
    const highestSaveCount = Math.max(...query.data.map((place) => place.saveCount), 0)
    const minimumSaveCount = highestSaveCount / 2

    return query.data
      .filter((place) => place.saveCount >= minimumSaveCount)
      .filter((place) => !filters.location || place.destinations.includes(filters.location))
      .filter((place) => !filters.category || place.categories.includes(filters.category))
      .toSorted((first, second) => second.saveCount - first.saveCount)
  }, [filters.category, filters.location, query.data])

  return { ...query, data: places }
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

function getSinceDate(months: number): string {
  const sinceDate = new Date()
  sinceDate.setMonth(sinceDate.getMonth() - months)
  return sinceDate.toISOString().split('T')[0] ?? ''
}

export type ExplorerPlace = ExploredPlace | MostSavedPlace
