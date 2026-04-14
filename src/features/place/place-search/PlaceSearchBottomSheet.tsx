import { useState, useEffect } from 'react'
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
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import type { MapType } from '../../../shared/components/Map'
import { usePlaceSearch } from './usePlaceSearch'
import type { PlaceSearchResult } from './PlaceSearchDialog'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (place: PlaceSearchResult) => void
  mapType?: MapType
}

export function PlaceSearchBottomSheet({ isOpen, onClose, onSelect, mapType = 'kakao' }: Props) {
  const [keyword, setKeyword] = useState('')

  const { results, isLoading, error, search, clear } = usePlaceSearch({ type: mapType })

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setKeyword('')
      clear()
    }
  }, [isOpen, clear])

  const handleKeywordChange = (value: string) => {
    setKeyword(value)
    search(value)
  }

  const handleSelect = (place: PlaceSearchResult) => {
    onSelect(place)
    onClose()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.5, 0.75, 0.9]}
      defaultSnapIndex={1}
    >
      <BottomSheet.Header>
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
        />
      </BottomSheet.Header>
      <BottomSheet.Body>
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
      </BottomSheet.Body>
    </BottomSheet>
  )
}
