import { MaterialIcons } from '@expo/vector-icons'
import { ToggleButton, ToggleButtonGroup } from '~/shared/components/design-system'
import type { ExplorerViewMode } from './useExplorerViewMode'

interface Props {
  value: ExplorerViewMode
  onChange: (value: ExplorerViewMode) => void
}

export function ExplorerViewToggleButton({ value, onChange }: Props) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, next) => {
        if (next === 'list' || next === 'map') onChange(next)
      }}
      size="small"
    >
      <ToggleButton value="list"><MaterialIcons name="format-list-bulleted" size={16} /></ToggleButton>
      <ToggleButton value="map"><MaterialIcons name="map" size={16} /></ToggleButton>
    </ToggleButtonGroup>
  )
}
