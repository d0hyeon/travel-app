import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useAirportSearch, type Airport } from '@waylog/domains/modules/airport'
import { AsyncBoundary } from '@waylog/react'
import { useState } from 'react'
import { SearchPanelLayout } from '../transport-form/SearchPanelLayout'

interface Props {
  title: string
  onSelect: (airport: Airport) => void
  onClose: () => void
}

export function AirportSearchPanel({ title, onSelect, onClose }: Props) {
  const [keyword, setKeyword] = useState('')

  return (
    <SearchPanelLayout
      title={title}
      placeholder="예: 인천공항, ICN, 오사카"
      keyword={keyword}
      onKeywordChange={setKeyword}
      isEmpty={false}
      onClose={onClose}
    >
      <AsyncBoundary
        resetKeys={[keyword]}
        pendingFallback={<AirportSearchPanelSkeleton />}
        rejectedFallback={() => (
          <Typography variant="caption" color="text.secondary" textAlign="center" py={4} display="block">
            공항 목록을 불러오지 못했어요.
          </Typography>
        )}
      >
        <Resolved keyword={keyword} onSelect={onSelect} />
      </AsyncBoundary>
    </SearchPanelLayout>
  )
}

function Resolved({ keyword, onSelect }: { keyword: string; onSelect: (airport: Airport) => void }) {
  const results = useAirportSearch(keyword)

  if (results.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" textAlign="center" py={4} display="block">
        검색 결과가 없어요.
      </Typography>
    )
  }

  return (
    <Stack border="1px solid" borderColor="divider" borderRadius={2}>
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
    </Stack>
  )
}

function AirportSearchPanelSkeleton() {
  return (
    <Stack gap={0.5} p={1.5} border="1px solid" borderColor="divider" borderRadius={2}>
      <Skeleton width="70%" height={20} />
      <Skeleton width="50%" height={16} />
    </Stack>
  )
}
