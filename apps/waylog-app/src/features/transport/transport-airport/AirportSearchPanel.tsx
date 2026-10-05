import { useAirportSearch, type Airport } from '@waylog/domains/modules/airport'
import { AsyncBoundary } from '@waylog/react'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Skeleton, Typography } from '~shared/components/design-system'
import { palette, radius } from '~shared/config/tokens'
import { SearchPanelLayout } from '~features/transport/transport-form/SearchPanelLayout'

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
        rejectedFallback={() => <Typography style={styles.emptyText}>공항 목록을 불러오지 못했어요.</Typography>}
      >
        <Resolved keyword={keyword} onSelect={onSelect} />
      </AsyncBoundary>
    </SearchPanelLayout>
  )
}

function Resolved({ keyword, onSelect }: { keyword: string; onSelect: (airport: Airport) => void }) {
  const results = useAirportSearch(keyword)

  if (results.length === 0) {
    return <Typography style={styles.emptyText}>검색 결과가 없어요.</Typography>
  }

  return (
    <View style={styles.results}>
      {results.map((airport, index) => (
        <Pressable
          key={airport.code}
          style={[styles.row, index > 0 && styles.rowDivided]}
          onPress={() => onSelect(airport)}
        >
          <Typography style={styles.name}>{airport.nameKo}</Typography>
          <Typography style={styles.detail}>
            {airport.code} · {airport.cityKo}
          </Typography>
        </Pressable>
      ))}
    </View>
  )
}

function AirportSearchPanelSkeleton() {
  return (
    <View style={styles.results}>
      <View style={styles.row}>
        <Skeleton width="70%" height={17} />
        <Skeleton width="50%" height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { padding: 14 },
  rowDivided: { borderTopWidth: 1, borderTopColor: palette.divider },
  name: { fontSize: 13.5, fontWeight: '700' },
  detail: { fontSize: 12, color: palette.textSecondary },
  results: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  emptyText: { fontSize: 12.5, color: palette.textSecondary, textAlign: 'center', paddingVertical: 32 },
})
