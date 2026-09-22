import { searchAirports, type Airport } from '@waylog/domains/modules/airport'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
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
    </SearchPanelLayout>
  )
}

const styles = StyleSheet.create({
  row: { padding: 14 },
  rowDivided: { borderTopWidth: 1, borderTopColor: palette.divider },
  name: { fontSize: 13.5, fontWeight: '700' },
  detail: { fontSize: 12, color: palette.textSecondary },
})
