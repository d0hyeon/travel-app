import { useState, useCallback, useRef, useEffect } from 'react'
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
import { loadKakaoMap } from '../../../shared/lib/kakao'
import { KakaoMap } from '../../../shared/components/KakaoMap'

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
}

export function PlaceSearchDialog({ isOpen, onClose, onSelect }: Props) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const placesRef = useRef<kakao.maps.services.Places | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const focusedPlace = focusedIndex >= 0 ? results[focusedIndex] : null


  useEffect(() => {
    loadKakaoMap().then(() => {
      placesRef.current = new kakao.maps.services.Places()
    })
  }, [])

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setKeyword('')
      setResults([])
      setFocusedIndex(-1)
      setError(null)
    }
  }, [isOpen])

  const search = useCallback((query: string) => {
    if (!placesRef.current || !query.trim()) {
      setResults([])
      setFocusedIndex(-1)
      return
    }

    setIsLoading(true)
    setError(null)

    placesRef.current.keywordSearch(query, (data, status) => {
      setIsLoading(false)

      if (status === kakao.maps.services.Status.OK) {
        setResults(
          data.map((item) => ({
            id: item.id,
            name: item.place_name,
            address: item.road_address_name || item.address_name,
            lat: parseFloat(item.y),
            lng: parseFloat(item.x),
          }))
        )
        setFocusedIndex(-1)
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        setResults([])
        setFocusedIndex(-1)
      } else {
        setError('검색 중 오류가 발생했습니다')
      }
    })
  }, [])

  const handleKeywordChange = (value: string) => {
    setKeyword(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      search(value)
    }, 300)
  }

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
            onChange={(e) => handleKeywordChange(e.target.value)}
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
                {error}
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

        {/* Right: Map (preloaded) */}
        <Box sx={{ flex: 1, position: 'relative', bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
          <KakaoMap height="100%" key={focusedPlace?.id}>
            {focusedPlace && <KakaoMap.Marker {...focusedPlace} />}
          </KakaoMap>

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
