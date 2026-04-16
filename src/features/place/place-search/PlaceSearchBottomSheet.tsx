import BackIcon from '@mui/icons-material/ArrowBackIos'
import DeleteIcon from '@mui/icons-material/Cancel'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Slide,
  Stack,
  styled,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '~shared/components/ListItem'
import { useDebouncedValue } from '~shared/hooks/extends/useDebouncedValue'
import type { Coordinate, MapType } from '../../../shared/components/Map'
import type { PlaceSearchResult } from './PlaceSearchDialog'
import { PlaceSearchSelectScreen } from './PlaceSearchSelectScreen'
import { useLaststSearchKeywords } from './useLaststSearchKeywords'
import { usePlaceSearch } from './usePlaceSearch'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (place: PlaceSearchResult) => void
  mapType?: MapType;
  center?: Coordinate;
}


export function PlaceSearchBottomSheet({ isOpen, onClose, onSelect, center, mapType = 'kakao' }: Props) {
  const [keyword, setKeyword] = useState('')
  const searchKeyword = useDebouncedValue(keyword, 300);

  const { data: results, isLoading, error, } = usePlaceSearch({
    keyword: searchKeyword,
    type: mapType,
    location: center,
  })

  useEffect(() => {
    if (isOpen) setKeyword('');
  }, [isOpen]);

  const handleSelect = (place: PlaceSearchResult) => {
    onSelect(place)
    onClose()
  }

  const [isOpenedDetail, setIsOpenedDetail] = useState(false)
  const { data: keywords, record, remove } = useLaststSearchKeywords();

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        snapPoints={[0.95]}
        defaultSnapIndex={0}
      >
        <BottomSheet.Header>
          <TextField
            autoFocus={isOpen}
            fullWidth
            placeholder="장소명을 입력하세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            size="small"
            InputProps={{
              endAdornment: keyword !== '' && (
                <InputAdornment position="end" onClick={() => setIsOpenedDetail(true)}>
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            onKeyDown={(event) => {
              if (event.code === 'Enter') {
                setIsOpenedDetail(true)
                record(keyword);
              }
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
              {error.message}
            </Typography>
          )}

          {!isLoading && !error && results.length === 0 && keyword && (
            <Typography color="text.secondary" textAlign="center" py={4}>
              검색 결과가 없습니다
            </Typography>
          )}

          {!isLoading && !error && results.length === 0 && !keyword && (
            <Box paddingTop={2} paddingX={1}>
              <Typography variant="body2">최근 검색어</Typography>
              <Stack gap={1} alignItems="stretch" marginTop={2} >
                {keywords.map(keyword => (
                  <LinedItem key={keyword} role="button" onClick={() => {
                    setKeyword(keyword);
                    setIsOpenedDetail(true)
                  }}
                  >
                    <Typography variant="body2" color="textSecondary">{keyword}</Typography>
                    <IconButton onClick={() => remove(keyword)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </LinedItem>
                ))}
              </Stack>
            </Box>
          )}

          {!isLoading && results.length > 0 && (
            <List disablePadding>
              {results.map((place) => (
                <ListItemButton
                  key={place.id}
                  onClick={() => handleSelect(place)}
                  sx={{ borderRadius: 1, py: 1.5 }}
                >
                  <ListItem.Title>{place.name}</ListItem.Title>
                  <ListItem.Text>{place.address}</ListItem.Text>
                </ListItemButton>
              ))}
            </List>
          )}
        </BottomSheet.Body>
      </BottomSheet>
      <Slide
        direction="left"
        in={isOpenedDetail}
        timeout={{ enter: 450, exit: 450 }}
        easing={{ enter: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
        mountOnEnter
        unmountOnExit
      >
        <PlaceSearchSelectScreen
          width="100%"
          keyword={keyword}
          onSelect={(value) => handleSelect(value)}
          center={center}
          mapServiceProvider={mapType}
          topNavigation={(
            <TextField
              defaultValue={keyword}
              size="small"
              InputProps={{
                onKeyUp: (event) => {
                  if (event.code === 'Enter') {
                    setKeyword(event.currentTarget.value);
                  }
                },
                startAdornment: (
                  <InputAdornment position="start" onClick={() => setIsOpenedDetail(false)}>
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

const LinedItem = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`,
}))