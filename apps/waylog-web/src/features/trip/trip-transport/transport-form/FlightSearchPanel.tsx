import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import { Box, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from 'date-fns'
import { useState } from 'react'
import { searchFlights, type FlightSearchResult } from '@waylog/domains/modules/transport'

interface Props {
  onSelect: (flight: FlightSearchResult) => void
  onClose: () => void
}

// 인라인 결과가 아니라 전체 화면이다. 입력과 동시에 목록이 펼쳐지면
// 아래 필드들이 밀려 내려간다.
// 진행 스텝은 아니다 -- 필드 하나를 채우는 보조 동작이라 퍼널 밖에 있다.
export function FlightSearchPanel({ onSelect, onClose }: Props) {
  const [keyword, setKeyword] = useState('')

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['flight-search', keyword],
    queryFn: () => searchFlights(keyword),
    enabled: keyword.trim() !== '',
  })

  return (
    <Stack p={2} gap={2} height="100%" sx={{ overflowY: 'auto' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography fontSize={17} fontWeight={700}>
          항공편 검색
        </Typography>
        <IconButton aria-label="닫기" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <TextField
        label="항공사 또는 편명 검색"
        placeholder="예: KE721, 대한항공"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        autoFocus
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                {isFetching ? <CircularProgress size={16} /> : <SearchIcon fontSize="small" color="disabled" />}
              </InputAdornment>
            ),
          },
        }}
      />

      {results.length > 0 && (
        <Stack border="1px solid" borderColor="divider" borderRadius={2} overflow="hidden">
          {results.map((flight, index) => (
            <Stack
              key={flight.ident_iata}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              p={1.5}
              borderTop={index === 0 ? undefined : '1px solid'}
              borderColor="divider"
              onClick={() => onSelect(flight)}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  {flight.operatorName} {flight.ident_iata}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {flight.origin.code_iata} {formatDate(new Date(flight.scheduled_out), 'HH:mm')}
                  {' → '}
                  {flight.destination.code_iata} {formatDate(new Date(flight.scheduled_in), 'HH:mm')}
                </Typography>
              </Box>
              <Typography variant="caption" color="primary" fontWeight={700}>
                선택
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      {keyword.trim() !== '' && !isFetching && results.length === 0 && (
        <Typography variant="caption" color="text.secondary" textAlign="center" py={4}>
          검색 결과가 없어요. 아래에서 직접 입력해 등록할 수 있어요.
        </Typography>
      )}
    </Stack>
  )
}
