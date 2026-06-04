import CheckIcon from '@mui/icons-material/Check'
import { Button, Chip, ListItemIcon, Menu, MenuItem, Paper, Popover, Stack } from '@mui/material'
import { useRef, useState } from 'react'
import type { Location } from '~features/location'
import { LocationForm } from '~features/location/LocationForm'
import type { PlaceCategoryType } from '~features/place/place.types'
import { PlaceCategoryTypeLabel } from '~features/place/place.types'
import { EXPLORER_CATEGORY_TYPES } from '../explorer.api'
import { useExplorerFilterParams } from './useExplorerFilterParams'

const CHIP_SX = { fontSize: 11, height: 26 } as const

export const ExplorerFilterDesktop = {
  LocationChip: () => {
    const { location, setLocation } = useExplorerFilterParams()
    const chipRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)

    const handleSubmit = (value: Location) => {
      setLocation(value)
      setOpen(false)
    }
    const handleReset = () => {
      setLocation(undefined)
      setOpen(false)
    }

    return (
      <>
        <Chip
          ref={chipRef}
          label={location ?? '지역'}
          onClick={() => setOpen(true)}
          color={location ? 'primary' : 'default'}
          variant="outlined"
          size="small"
          sx={{ ...CHIP_SX, fontWeight: location ? 700 : 400 }}
        />
        <Popover
          open={open}
          anchorEl={chipRef.current}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Paper sx={{ width: 320, p: 2 }}>
            <LocationForm
              defaultValue={location ?? undefined}
              onSubmit={handleSubmit}
            >
              <Stack direction="row" gap={1} mt={2}>
                <Button
                  type="button"
                  color="error"
                  variant="outlined"
                  size="small"
                  onClick={handleReset}
                  fullWidth
                >
                  초기화
                </Button>
                <LocationForm.SubmitButton variant="contained" size="small" fullWidth>
                  확인
                </LocationForm.SubmitButton>
              </Stack>
            </LocationForm>
          </Paper>
        </Popover>
      </>
    )
  },

  CategoryChip: () => {
    const { category, setCategory } = useExplorerFilterParams()
    const chipRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)

    const handleSelect = (cat: PlaceCategoryType | undefined) => {
      setCategory(cat)
      setOpen(false)
    }

    return (
      <>
        <Chip
          ref={chipRef}
          label={category ? PlaceCategoryTypeLabel[category] : '카테고리'}
          onClick={() => setOpen(true)}
          color={category ? 'primary' : 'default'}
          variant="outlined"
          size="small"
          sx={{ ...CHIP_SX, fontWeight: category ? 700 : 400 }}
        />
        <Menu
          anchorEl={chipRef.current}
          open={open}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <MenuItem onClick={() => handleSelect(undefined)}>
            {category === undefined && <ListItemIcon><CheckIcon fontSize="small" color="primary" /></ListItemIcon>}
            전체
          </MenuItem>
          {EXPLORER_CATEGORY_TYPES.map((cat: PlaceCategoryType) => (
            <MenuItem
              key={cat}
              onClick={() => handleSelect(cat)}
            >
              {category === cat && <ListItemIcon><CheckIcon fontSize="small" color="primary" /></ListItemIcon>}
              {PlaceCategoryTypeLabel[cat]}
            </MenuItem>
          ))}
        </Menu>
      </>
    )
  },
}
