import { useMemo } from 'react'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'

export type ViewMode = 'list' | 'map'

export function useExplorerViewMode() {
  const [state, setState] = useQueryParamState<ViewMode>('explorer-view-mode', {
    defaultValue: 'list',
  })

  return useMemo(() => [
    state,
    (value: ViewMode) => setState(value, {
      replace: false,
      viewTransition: true,
    })
  ] as const, [state])
}
