import { MaterialIcons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { IconButton, TextField, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../../shared/config/tokens'
import { useKeyboardMetrics } from '../../../../shared/hooks/env/useKeyboardMetrics'

interface Props {
  title: string
  placeholder: string
  keyword: string
  onKeywordChange: (next: string) => void
  isEmpty: boolean
  children: ReactNode
  onClose: () => void
}

// 인라인 결과가 아니라 전체 화면이다. 입력과 동시에 목록이 펼쳐지면
// 아래 필드들이 밀려 내려간다.
//
// 무엇을 찾는지는 모른다 -- 껍데기만 든다. 대상을 아는 것은 각 패널이다.
export function SearchPanelLayout({
  title,
  placeholder,
  keyword,
  onKeywordChange,
  isEmpty,
  children,
  onClose,
}: Props) {
  const { metrics: keyboard } = useKeyboardMetrics();
  // 목록만 스크롤한다. 제목과 입력이 같이 밀려 올라가면 무엇을 고르는
  // 중이었는지 잃고, 좁히려 해도 입력까지 되돌아가야 한다.
  return (
    <View style={[styles.screen, { paddingBottom: keyboard?.height }]}>
      <View style={styles.head}>
        <View style={styles.header}>
          <Typography style={styles.title}>{title}</Typography>
          <IconButton onPress={onClose}>
            <MaterialIcons name="close" size={20} color={palette.text} />
          </IconButton>
        </View>

        <TextField
          placeholder={placeholder}
          value={keyword}
          onChangeText={onKeywordChange}
          autoFocus
        />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!isEmpty && <View style={styles.results}>{children}</View>}

        {isEmpty && (
          <View style={styles.empty}>
            <MaterialIcons name="search-off" size={28} color={palette.textSecondary} />
            <Typography style={styles.emptyText}>검색 결과가 없어요.</Typography>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  head: { padding: 16, gap: 16 },
  body: { paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '700' },
  results: {
    borderWidth: 1,
    borderColor: palette.divider,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyText: { fontSize: 12.5, color: palette.textSecondary },
})
