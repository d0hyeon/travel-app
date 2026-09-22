import { Box, Stack, Typography } from '@mui/material'
import { searchAirports, type Airport } from '@waylog/domains/modules/airport'
import { useMemo, useState } from 'react'
import { SearchPanelLayout } from '../transport-form/SearchPanelLayout'

interface Props {
  title: string
  onSelect: (airport: Airport) => void
  onClose: () => void
}

export function AirportSearchPanel({ title, onSelect, onClose }: Props) {
  const [keyword, setKeyword] = useState('')
  const results = useMemo(() => searchAirports(keyword), [keyword])

  return (
    <SearchPanelLayout
      title={title}
      placeholder="예: 인천공항, ICN, 오사카"
      keyword={keyword}
      onKeywordChange={setKeyword}
      isEmpty={results.length === 0}
      onClose={onClose}
    >
      {results.map((airport, index) => (
        <Box
          key={airport.code}
          p={1.5}
          borderTop={index === 0 ? undefined : '1px solid'}
          borderColor="divider"
          onClick={() => onSelect(airport)}
          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        >
          <Stack>
            <Typography variant="body2" fontWeight={700}>
              {airport.nameKo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {airport.code} · {airport.cityKo}
            </Typography>
          </Stack>
        </Box>
      ))}
    </SearchPanelLayout>
  )
}
