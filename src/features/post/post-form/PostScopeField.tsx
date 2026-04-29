import { Autocomplete, TextField } from '@mui/material'
import { useTripPlaces } from '~features/trip/trip-place/useTripPlaces'
import type { PostScope } from '../post.types'

interface Props {
  tripId: string
  value: PostScope | null
  onChange: (value: PostScope | null) => void
}

/**
 * 1차에서는 PLACE 단위만 지원한다.
 * LOCATION(도시) 단위는 place→location 매핑 도입 후 다음 단계에서 추가.
 */
export function PostScopeField({ tripId, value, onChange }: Props) {
  const { data: places } = useTripPlaces(tripId)
  const options = places.map(p => ({ label: p.name, value: p.id }))
  const selected = value?.kind === 'PLACE'
    ? options.find(o => o.value === value.placeId) ?? null
    : null

  return (
    <Autocomplete
      size="small"
      options={options}
      value={selected}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      onChange={(_, next) => {
        onChange(next ? { kind: 'PLACE', placeId: next.value } : null)
      }}
      renderInput={(params) => <TextField {...params} label="장소 (선택)" />}
    />
  )
}
