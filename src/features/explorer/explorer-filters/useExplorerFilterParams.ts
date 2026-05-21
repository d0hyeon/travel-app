import type { Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'

export function useExplorerFilterParams() {
  const [location, setLocation] = useQueryParamState<Location>('location', {
    defaultValue: undefined,
    
  })
  const [category, setCategory] = useQueryParamState<PlaceCategoryType>('category', {
    defaultValue: undefined,
  })

  return { location, setLocation, category, setCategory }
}
