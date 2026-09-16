import { MaterialIcons } from '@expo/vector-icons'
import { useMemo, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { IconButton, TextField, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../../shared/config/tokens'

interface Props<T> {
  title: string
  placeholder: string
  search: (keyword: string) => T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  onSelect: (item: T) => void
  onClose: () => void
}

// 인라인 결과가 아니라 전체 화면이다. 입력과 동시에 목록이 펼쳐지면
// 아래 필드들이 밀려 내려간다.
export function SearchSelectPanel<T>({
  title,
  placeholder,
  search,
  getKey,
  renderItem,
  onSelect,
  onClose,
}: Props<T>) {
  const [keyword, setKeyword] = useState('')
  const results = useMemo(() => search(keyword), [keyword, search])

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Typography style={styles.title}>{title}</Typography>
        <IconButton onPress={onClose}>
          <MaterialIcons name="close" size={20} color={palette.text} />
        </IconButton>
      </View>

      <TextField
        placeholder={placeholder}
        value={keyword}
        onChangeText={setKeyword}
        autoFocus
      />

      {results.length > 0 && (
        <View style={styles.results}>
          {results.map((item, index) => (
            <Pressable
              key={getKey(item)}
              style={[styles.resultRow, index > 0 && styles.resultRowDivided]}
              onPress={() => onSelect(item)}
            >
              {renderItem(item)}
            </Pressable>
          ))}
        </View>
      )}

      {results.length === 0 && (
        <View style={styles.empty}>
          <MaterialIcons name="search-off" size={28} color={palette.textSecondary} />
          <Typography style={styles.emptyText}>검색 결과가 없어요.</Typography>
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
  resultRow: { padding: 14 },
  resultRowDivided: { borderTopWidth: 1, borderTopColor: palette.divider },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyText: { fontSize: 12.5, color: palette.textSecondary },
})
