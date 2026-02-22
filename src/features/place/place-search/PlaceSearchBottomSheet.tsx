import { useState, useCallback, useRef, useEffect } from 'react'
import {
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { loadKakaoMap } from '../../../shared/lib/kakao'
import { DraggableBottomSheet } from '../../../shared/components/DraggableBottomSheet'
import type { PlaceSearchResult } from './PlaceSearchDialog'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (place: PlaceSearchResult) => void
}

export function PlaceSearchBottomSheet({ isOpen, onClose, onSelect }: Props) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<PlaceSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const placesRef = useRef<kakao.maps.services.Places | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadKakaoMap().then(() => {
      placesRef.current = new kakao.maps.services.Places()
    })
  }, [])

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setKeyword('')
      setResults([])
      setError(null)
    }
  }, [isOpen])

  const search = useCallback((query: string) => {
    if (!placesRef.current || !query.trim()) {
      setResults([])
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
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        setResults([])
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

  const handleSelect = (place: PlaceSearchResult) => {
    onSelect(place)
    onClose()
  }

  return (
    <DraggableBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.5, 0.75, 0.9]}
      defaultSnapIndex={1}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TextField
          autoFocus={isOpen}
          fullWidth
          placeholder="장소명을 입력하세요"
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2, flexShrink: 0 }}
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
            <List disablePadding>
              {results.map((place) => (
                <ListItemButton
                  key={place.id}
                  onClick={() => handleSelect(place)}
                  sx={{ borderRadius: 1, py: 1.5 }}
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
    </DraggableBottomSheet>
  )
}
