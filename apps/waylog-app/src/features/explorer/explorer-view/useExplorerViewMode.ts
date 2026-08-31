import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'

export type ExplorerViewMode = 'list' | 'map'

export function useExplorerViewMode(): [ExplorerViewMode, (next: ExplorerViewMode) => void] {
  return useQueryParamState<ExplorerViewMode>('view', { defaultValue: 'list', parse: parseViewMode })
}

function parseViewMode(value: string): ExplorerViewMode {
  return value === 'map' ? 'map' : 'list'
}
