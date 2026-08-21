import { useMemo } from 'react'
import type { Location } from '@waylog/domains/location'
import type { PlaceCategoryType } from '@waylog/domains/place'
import { useExploredPlaces } from './explorer-ranking/useExploredPlaces'
import { useRecentHotPlaces } from './explorer-recent/useRecentHotPlaces'
import { useMostSavedPlaces } from './explorer-saved/useMostSavedPlaces'

export interface AttentionPlace {
  placeId: string
  name: string
  lat: number
  lng: number
  thumbnailUrl?: string
  /** 0~1 순위 기반 정규화된 주목도 점수 */
  score: number
}

interface Options {
  location?: Location | null
  category?: PlaceCategoryType | null
}

const WEIGHT_VISITED = 0.4
const WEIGHT_HOT = 0.35
const WEIGHT_SAVED = 0.25

export function useAttentionPlaces({ location, category }: Options = {}) {
  const { data: visitedPlaces } = useExploredPlaces(location, category)
  const { data: hotPlaces } = useRecentHotPlaces({ inquiryMonths: 3, location: location ?? undefined, category: category ?? undefined })
  const { data: savedPlaces } = useMostSavedPlaces({ location, category })

  return useMemo(() => {
    const merged = mergeScoreMaps(
      toScoreMap(visitedPlaces, (p) => p.visitorCount, 'visited'),
      toScoreMap(hotPlaces, (p) => p.visitorCount, 'hot'),
      toScoreMap(savedPlaces, (p) => p.saveCount, 'saved'),
    )

    const raw = [...merged.values()].map((entry) => ({
      placeId: entry.placeId,
      name: entry.name,
      lat: entry.lat,
      lng: entry.lng,
      thumbnailUrl: entry.thumbnailUrl,
      score: entry.visited * WEIGHT_VISITED + entry.hot * WEIGHT_HOT + entry.saved * WEIGHT_SAVED,
    }))

    return rankNormalize(raw).toSorted((a, b) => b.score - a.score)
  }, [visitedPlaces, hotPlaces, savedPlaces])
}

// ── helpers ────────────────────────────────────────────

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
  getValue: (p: T) => number,
  key: 'visited' | 'hot' | 'saved',
): Map<string, ScoreEntry> {
  const max = Math.max(1, ...places.map(getValue))
  return new Map(
    places.map((p) => [
      p.placeId,
      { placeId: p.placeId, name: p.name, lat: p.lat, lng: p.lng, thumbnailUrl: p.thumbnailUrl, visited: 0, hot: 0, saved: 0, [key]: getValue(p) / max },
    ])
  )
}

function mergeScoreMaps(...maps: Map<string, ScoreEntry>[]): Map<string, ScoreEntry> {
  return maps.reduce((result, map) => {
    map.forEach((entry, id) => {
      const existing = result.get(id)
      result.set(id, existing
        ? { ...existing, visited: existing.visited + entry.visited, hot: existing.hot + entry.hot, saved: existing.saved + entry.saved }
        : entry
      )
    })
    return result
  }, new Map<string, ScoreEntry>())
}

function rankNormalize(places: AttentionPlace[]): AttentionPlace[] {
  const scoreAscending = places.toSorted((a, b) => a.score - b.score)
  return places.map((p) => ({
    ...p,
    score: scoreAscending.length <= 1 ? 0 : scoreAscending.findIndex((s) => s.placeId === p.placeId) / (scoreAscending.length - 1),
  }))
}
