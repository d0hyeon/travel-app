import { MaterialIcons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { searchFlights, type FlightSearchResult } from '@waylog/domains/modules/transport'
import { format as formatDate } from 'date-fns'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { IconButton, TextField, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../../shared/config/tokens'

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
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Typography style={styles.title}>항공편 검색</Typography>
        <IconButton onPress={onClose}>
          <MaterialIcons name="close" size={20} color={palette.text} />
        </IconButton>
      </View>

      <TextField
        label="항공사 또는 편명 검색"
        placeholder="예: KE721, 대한항공"
        value={keyword}
        onChangeText={setKeyword}
        autoFocus
      />

      {isFetching && <ActivityIndicator />}

      {results.length > 0 && (
        <View style={styles.results}>
          {results.map((flight, index) => (
            <Pressable
              key={flight.ident_iata}
              style={[styles.resultRow, index > 0 && styles.resultRowDivided]}
              onPress={() => onSelect(flight)}
            >
              <View style={styles.resultInfo}>
                <Typography style={styles.flightName}>
                  {flight.operatorName} {flight.ident_iata}
                </Typography>
                <Typography style={styles.flightRoute}>
                  {flight.origin.code_iata} {formatDate(new Date(flight.scheduled_out), 'HH:mm')}
                  {' → '}
                  {flight.destination.code_iata}{' '}
                  {formatDate(new Date(flight.scheduled_in), 'HH:mm')}
                </Typography>
              </View>
              <Typography style={styles.selectLabel}>선택</Typography>
            </Pressable>
          ))}
        </View>
      )}

      {keyword.trim() !== '' && !isFetching && results.length === 0 && (
        <View style={styles.empty}>
          <MaterialIcons name="search-off" size={28} color={palette.textSecondary} />
          <Typography style={styles.emptyText}>
            검색 결과가 없어요. 직접 입력해 등록할 수 있어요.
          </Typography>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '700' },
  results: {
    borderWidth: 1,
    borderColor: palette.divider,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  resultRowDivided: { borderTopWidth: 1, borderTopColor: palette.divider },
  resultInfo: { gap: 2 },
  flightName: { fontSize: 13.5, fontWeight: '700' },
  flightRoute: { fontSize: 12, color: palette.textSecondary },
  selectLabel: { fontSize: 12, fontWeight: '700', color: palette.primary },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyText: { fontSize: 12.5, color: palette.textSecondary },
})
