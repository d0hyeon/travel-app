import { searchAirlines, type Airline } from '@waylog/domains/modules/airline'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { palette } from '../../../../shared/config/tokens'
import { SearchPanelLayout } from './SearchPanelLayout'

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
        <Pressable
          key={airline.code}
          style={[styles.row, index > 0 && styles.rowDivided]}
          onPress={() => onSelect(airline)}
        >
          <Typography style={styles.name}>{airline.nameKo}</Typography>
          <Typography style={styles.detail}>{airline.code}</Typography>
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
