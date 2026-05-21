import { useState } from 'react'

export type ViewMode = 'list' | 'map'

export function useExplorerViewMode() {
  return useState<ViewMode>('list')
}
