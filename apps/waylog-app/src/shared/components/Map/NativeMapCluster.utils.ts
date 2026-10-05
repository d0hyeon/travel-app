import { palette } from '../../config/tokens'

interface ClusterRing {
  width: number
  color: string
}

interface ClusterAppearance {
  size: number
  fontSize: number
  background: string
  textColor: string
  glowColor: string
  glowRadius: number
  glowOpacity: number
  shadowOpacity: number
  shadowRadius: number
  shadowOffsetY: number
  elevation: number
  rings?: ClusterRing[]
}

const SPARSE_MAX_COUNT = 10
const MODERATE_MAX_COUNT = 20

const SPARSE_BACKGROUND = '#DCE7FF'
const DENSE_BACKGROUND = palette.primary

const SPARSE_TEXT = '#1B4599'
const DENSE_TEXT = '#fff'

const INNER_RING_COLOR = 'rgba(76, 132, 255, 0.34)'
const OUTER_RING_COLOR = 'rgba(76, 132, 255, 0.14)'

export function resolveClusterAppearance(count: number): ClusterAppearance {
  if (count <= SPARSE_MAX_COUNT) {
    return {
      size: 32,
      fontSize: 14,
      background: SPARSE_BACKGROUND,
      textColor: SPARSE_TEXT,
      glowColor: DENSE_BACKGROUND,
      glowRadius: 5,
      glowOpacity: 0.5,
      shadowOpacity: 0.16,
      shadowRadius: 3,
      shadowOffsetY: 1,
      elevation: 3,
    }
  }
  if (count <= MODERATE_MAX_COUNT) {
    return {
      size: 40,
      fontSize: 16,
      background: DENSE_BACKGROUND,
      textColor: DENSE_TEXT,
      glowColor: SPARSE_BACKGROUND,
      glowRadius: 6,
      glowOpacity: 0.85,
      shadowOpacity: 0.22,
      shadowRadius: 5,
      shadowOffsetY: 2,
      elevation: 5,
    }
  }
  return {
    size: 42,
    fontSize: 16,
    background: DENSE_BACKGROUND,
    textColor: DENSE_TEXT,
    glowColor: SPARSE_BACKGROUND,
    glowRadius: 4,
    glowOpacity: 0.4,
    shadowOpacity: 0.28,
    shadowRadius: 7,
    shadowOffsetY: 3,
    elevation: 7,
    rings: [
      { width: 6, color: INNER_RING_COLOR },
      { width: 5, color: OUTER_RING_COLOR },
    ],
  }
}

export function formatClusterCount(count: number): string {
  if (count < 1000) return String(count)
  if (count < 10_000) return `${Math.floor(count / 100) / 10}k`
  return `${Math.floor(count / 1000)}k`
}
