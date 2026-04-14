import CheckIcon from '@mui/icons-material/Check'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, Checkbox, Chip, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '../../../shared/components/ListItem'
import { PlaceCategoryColorCode, type Place } from '../../place/place.types'

interface PlaceSelectSheetProps {
  isOpen: boolean
  onClose: () => void
  places: Place[]
  selectedPlaceIds: string[]
  onConfirm: (placeIds: string[]) => void
}

export function PlaceSelectSheet({
  isOpen,
  onClose,
  places,
  selectedPlaceIds,
  onConfirm,
}: PlaceSelectSheetProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const handleToggle = (placeId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(placeId)) {
        next.delete(placeId)
      } else {
        next.add(placeId)
      }
      return next
    })
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selected))
    setSelected(new Set())
    onClose()
  }

  const handleClose = () => {
    setSelected(new Set())
    setSearchQuery('')
    onClose()
  }

  const availablePlaces = places.filter((p) => !selectedPlaceIds.includes(p.id))

  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return availablePlaces
    const query = searchQuery.toLowerCase()
    return availablePlaces.filter(
      (place) =>
        place.name.toLowerCase().includes(query) ||
        place.address?.toLowerCase().includes(query) ||
        place.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }, [availablePlaces, searchQuery])

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      snapPoints={[0.5, 0.75]}
      defaultSnapIndex={0}
    >
      <BottomSheet.Header>
        <Typography variant="h6">장소 선택</Typography>
      </BottomSheet.Header>
      <BottomSheet.Body>
        <TextField
          size="small"
          fullWidth
          placeholder="장소 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 1.5 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        {filteredPlaces.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            {searchQuery ? '검색 결과가 없습니다' : '추가할 수 있는 장소가 없습니다'}
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {filteredPlaces.map((place) => {
              const isSelected = selected.has(place.id);

              return (
                <ListItem
                  key={place.id}
                  sx={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'primary.50' : undefined,
                  }}
                  onClick={() => handleToggle(place.id)}
                  leftAddon={
                    <Checkbox
                      checked={isSelected}
                      size="small"
                      sx={{ p: 0, mr: 1 }}
                    />
                  }
                >
                  <Stack direction="row" gap={0.5} alignItems="center">
                    {!!place.category && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: PlaceCategoryColorCode[place.category],
                        }}
                      />
                    )}
                    <ListItem.Title>{place.name}</ListItem.Title>
                  </Stack>
                  {place.address && (
                    <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
                      {place.address}
                    </ListItem.Text>
                  )}
                  {place.tags.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {place.tags.map((x) => (
                        <Chip key={x} label={x} size="small" />
                      ))}
                    </Stack>
                  )}
                </ListItem>
              )
            })}
          </Stack>
        )}
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" onClick={handleClose} sx={{ flex: 1 }}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selected.size === 0}
          startIcon={<CheckIcon />}
          sx={{ flex: 1 }}
        >
          추가 ({selected.size})
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}