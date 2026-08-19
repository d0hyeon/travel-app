import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListItemIcon, Menu, MenuItem, Stack } from '@mui/material'
import { useRef, useState } from 'react'
import { LocationForm } from '~features/location/LocationForm'
import type { PlaceCategoryType } from '~features/place/place.types'
import { PlaceCategoryTypeLabel } from '~features/place/place.types'
import { useOverlay } from '~shared/hooks/useOverlay'
import { EXPLORER_CATEGORY_TYPES } from '../explorer.api'
import { useExplorerFilterParams } from './useExplorerFilterParams'

const CHIP_SX = { fontSize: 11, height: 26 } as const

export const ExplorerFilters = {
  LocationChip: () => {
    const { location, setLocation } = useExplorerFilterParams()

    const overlay = useOverlay();
    const openLocationForm = () => {
      overlay.open(({ isOpen, close }) => (
        <Dialog open={isOpen} onClose={close} maxWidth="xs" fullWidth>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <DialogTitle>지역 선택</DialogTitle>
            <IconButton onClick={close} sx={{ marginRight: 1 }}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <DialogContent sx={{ padding: 0 }}>
            <LocationForm
              defaultValue={location ?? undefined}
              onSubmit={(location) => {
                setLocation(location)
                close();
              }}
              paddingInline={0}
            >
              <DialogActions sx={{ position: 'sticky', paddingRight: 2, bottom: 0, bgcolor: 'white', scrollbarWidth: '2px' }}>
                <Button
                  type="button"
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    setLocation(undefined);
                    close();
                  }}
                  fullWidth
                >
                  초기화
                </Button>
                <LocationForm.SubmitButton fullWidth variant="contained" >
                  확인
                </LocationForm.SubmitButton>
              </DialogActions>
            </LocationForm>
          </DialogContent>
        </Dialog >
      ))
    }

    return (
      <Chip
        label={location ?? '지역'}
        onClick={() => openLocationForm()}
        color={location ? 'primary' : 'default'}
        variant="outlined"
        size="small"
        sx={{ ...CHIP_SX, fontWeight: location ? 700 : 400 }}
      />
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
