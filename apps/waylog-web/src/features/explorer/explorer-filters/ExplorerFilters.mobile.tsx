import { Chip } from '@mui/material'
import { PlaceCategoryTypeLabel } from '@waylog/domains/place'
import { useCategoryBottomSheet } from './useCategoryBottomSheet'
import { useExplorerFilterParams } from './useExplorerFilterParams'
import { useLocationOverlay } from './useLocationOverlay'

const CHIP_SX = { fontSize: 11, height: 26 } as const

export const ExplorerFilters = {
  LocationChip: () => {
    const { location, setLocation } = useExplorerFilterParams()
    const openLocationOverlay = useLocationOverlay()

    return (
      <Chip
        label={location ?? '지역'}
        onClick={async () => {
          const result = await openLocationOverlay(location ?? undefined)
          setLocation(result ?? undefined)
        }}
        color={location ? 'primary' : 'default'}
        variant="outlined"
        size="small"
        sx={{ ...CHIP_SX, fontWeight: location ? 700 : 400 }}
      />
    )
  },

  CategoryChip: () => {
    const { category, setCategory } = useExplorerFilterParams()
    const selectCategory = useCategoryBottomSheet()

    return (
      <Chip
        label={category ? PlaceCategoryTypeLabel[category] : '카테고리'}
        onClick={async () => {
          const value = await selectCategory(category)
          setCategory(value ?? undefined)
        }}
        color={category ? 'primary' : 'default'}
        variant="outlined"
        size="small"
        sx={{ ...CHIP_SX, fontWeight: category ? 700 : 400 }}
      />
    )
  },
}
