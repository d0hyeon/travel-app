import BackIcon from '@mui/icons-material/ArrowBackIos'
import CheckIcon from '@mui/icons-material/Check'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, Checkbox, Chip, InputAdornment, Slide, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { PlaceSearchSelectScreen } from '~features/place/place-search/PlaceSearchSelectScreen'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '../../../shared/components/ListItem'
import { PlaceCategoryColorCode } from '../../place/place.types'
import { useTripPlaces } from '../trip-place/useTripPlaces'
import { useTrip } from '../useTrip'

interface PlaceSelectSheetProps {
  isOpen: boolean
  onClose: () => void
  tripId: string;
  selectedPlaceIds: string[]
  onConfirm: (placeIds: string[]) => void
}
export function PlaceSelectSheet(props: PlaceSelectSheetProps) {
  return (
    <BottomSheet
      isOpen={props.isOpen}
      onClose={props.onClose}
      snapPoints={[0.9]}
      defaultSnapIndex={0}
    >
      <BottomSheet.Header>
        <Typography variant="h6">장소 선택</Typography>
      </BottomSheet.Header>
      <Resolved {...props} />
    </BottomSheet>
  )
}
function Resolved({
  tripId,
  selectedPlaceIds,
  onConfirm,
  onClose,
}: PlaceSelectSheetProps) {
  const { data: { isOverseas, lat, lng } } = useTrip(tripId);
  const { data: places, create } = useTripPlaces(tripId);

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenDetail, setIsOpenDetail] = useState(false)

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
  }, [availablePlaces, searchQuery]);


  return (
    <>
      <BottomSheet.Body height="100%">
        <Stack height="100%">
          <TextField
            size="small"
            fullWidth
            placeholder="장소 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 1.5 }}
            slotProps={{
              input: {
                endAdornment: searchQuery !== '' && (
                  <InputAdornment position="end" onClick={() => setIsOpenDetail(true)}>
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                onKeyUp: (event) => {
                  if (event.code === 'Enter' && searchQuery !== '') {
                    setIsOpenDetail(true);
                    if (document.activeElement instanceof HTMLInputElement) {
                      document.activeElement.blur()
                    }
                  }
                }
              },
            }}
          />
          <Box flex="1" sx={{ overflowY: 'auto' }}>
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
          </Box>
        </Stack>
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" onClick={onClose} sx={{ flex: 1 }}>
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

      <Slide
        direction="left"
        in={isOpenDetail}
        timeout={{ enter: 450, exit: 450 }}
        easing={{ enter: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
        mountOnEnter
        unmountOnExit
      >
        <PlaceSearchSelectScreen
          width="100%"
          keyword={searchQuery}
          onSelect={async (value) => {
            const { id } = await create(value);
            handleToggle(id);
            setIsOpenDetail(false);
          }}
          center={{ lat, lng }}
          mapServiceProvider={isOverseas ? 'google' : 'kakao'}
          topNavigation={(
            <TextField
              defaultValue={searchQuery}
              size="small"
              InputProps={{
                onKeyUp: (event) => {
                  if (event.code === 'Enter') {
                    setSearchQuery(event.currentTarget.value);
                  }
                },
                startAdornment: (
                  <InputAdornment position="start" onClick={() => setIsOpenDetail(false)}>
                    <BackIcon color="action" />
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          )}
          sx={{ position: 'fixed', top: 0, left: 0, backgroundColor: '#fff', zIndex: 9999 }}
        />
      </Slide>
    </>
  )
}