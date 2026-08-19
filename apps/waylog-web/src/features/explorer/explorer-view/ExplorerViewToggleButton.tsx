import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import MapIcon from '@mui/icons-material/Map'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { type ViewMode } from './useExplorerViewMode'

export { useExplorerViewMode, type ViewMode } from './useExplorerViewMode'

type ViewToggleProps = { value: ViewMode; onChange: (value: ViewMode) => void }

export function ExplorerViewToggleButton({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v: ViewMode) => v && onChange(v)}
      size="small"
      sx={(theme) => ({
        backgroundColor: theme.palette.grey[200],
        padding: 0.5,
        borderRadius: '12px',
        '& .MuiToggleButton-root': { border: 'none', px: 1 },
        '.Mui-selected': { backgroundColor: '#fff !important' },
        '.MuiButtonBase-root': { borderRadius: '8px', paddingY: 0.5 },
      })}
    >
      <ToggleButton value="list" aria-label="리스트 뷰">
        <FormatListBulletedIcon fontSize="small" />
      </ToggleButton>
      <ToggleButton value="map" aria-label="지도 뷰">
        <MapIcon fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

