import { Box, Stack, Typography } from '@mui/material'
import { searchAirlines, type Airline } from '@waylog/domains/modules/airline'
import { useMemo, useState } from 'react'
import { SearchPanelLayout } from '../SearchPanelLayout'

interface Props {
  onSelect: (airline: Airline) => void
  onClose: () => void
}

export function AirlineSearchPanel({ onSelect, onClose }: Props) {
  const [keyword, setKeyword] = useState('')
  const results = useMemo(() => searchAirlines(keyword), [keyword])

  return (
    <SearchPanelLayout
      title="항공사 선택"
      placeholder="예: 대한항공, KE"
      keyword={keyword}
      onKeywordChange={setKeyword}
      isEmpty={results.length === 0}
      onClose={onClose}
    >
      {results.map((airline, index) => (
        <Box
          key={airline.code}
          p={1.5}
          borderTop={index === 0 ? undefined : '1px solid'}
          borderColor="divider"
          onClick={() => onSelect(airline)}
          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        >
          <Stack>
            <Typography variant="body2" fontWeight={700}>
              {airline.nameKo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {airline.code}
            </Typography>
          </Stack>
        </Box>
      ))}
    </SearchPanelLayout>
  )
}
