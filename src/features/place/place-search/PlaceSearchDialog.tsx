import { useState, useRef, useEffect, useDeferredValue } from 'react'
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { Map, type MapType } from '../../../shared/components/Map'
import { usePlaceSearch } from './usePlaceSearch'

export interface PlaceSearchResult {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (place: PlaceSearchResult) => void
  mapType?: MapType
}

export function PlaceSearchDialog({ isOpen, onClose, onSelect, mapType = 'kakao' }: Props) {
  const [keyword, setKeyword] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)

  const searchKeyword = useDeferredValue(keyword);
  const { data: results, isLoading, error } = usePlaceSearch({ type: mapType, keyword: searchKeyword })
  const focusedPlace = focusedIndex >= 0 && results ? results[focusedIndex] : null

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setKeyword('')
      setFocusedIndex(-1)
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (focusedPlace) {
      onSelect(focusedPlace)
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        handleSubmit()
        break
      case 'Escape':
        onClose()
        break
    }
  }

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[focusedIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { height: 560 } }}
    >
      <DialogContent sx={{ display: 'flex', gap: 2, p: 2 }}>
        {/* Left: Search + List */}
        <Box sx={{ width: 320, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <TextField
            autoFocus={isOpen}
            fullWidth
            placeholder="장소명을 입력하세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {isLoading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={24} />
              </Box>
            )}

            {error && (
              <Typography color="error" textAlign="center" py={4}>
                {error.message}
              </Typography>
            )}

            {!isLoading && !error && results.length === 0 && keyword && (
              <Typography color="text.secondary" textAlign="center" py={4}>
                검색 결과가 없습니다
              </Typography>
            )}

            {!isLoading && !error && results.length === 0 && !keyword && (
              <Typography color="text.secondary" textAlign="center" py={4}>
                검색어를 입력하세요
              </Typography>
            )}

            {!isLoading && results.length > 0 && (
              <List disablePadding ref={listRef}>
                {results.map((place, index) => (
                  <ListItemButton
                    key={place.id}
                    selected={index === focusedIndex}
                    onClick={() => {
                      onSelect(place)
                      onClose()
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    sx={{ borderRadius: 1, py: 1 }}
                  >
                    <ListItemText
                      primary={place.name}
                      secondary={place.address}
                      primaryTypographyProps={{ fontWeight: 'medium', fontSize: 14 }}
                      secondaryTypographyProps={{ fontSize: 12 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </Box>

        {/* Right: Map */}
        <Box sx={{ flex: 1, position: 'relative', bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
          <Map type={mapType} height="100%" key={focusedPlace?.id}>
            {focusedPlace && <Map.Marker {...focusedPlace} />}
          </Map>

          {/* Overlay when no place is focused */}
          {!focusedPlace && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                장소를 선택하면 지도에 표시됩니다
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>취소</Button>
        <Button
          variant="contained"
          disabled={!focusedPlace}
          onClick={handleSubmit}
        >
          확인
        </Button>
      </DialogActions>
    </Dialog>
  )
}
