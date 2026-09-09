import { usePlaceSearch, type PlaceResult } from '@waylog/domains/modules/place'
import type { Coordinate, MapProvider } from '@waylog/domains/modules/map'
import { useDebouncedValue } from '@waylog/react'
import { MaterialIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { StyleSheet, ActivityIndicator, FlatList, Keyboard, Pressable, TextInput, View } from 'react-native'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '../../../shared/components/ListItem'
import { IconButton, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../shared/config/tokens'
import { useLastSearchKeywords } from './useLastSearchKeywords'
import { PlaceSearchSelectScreen } from './PlaceSearchSelectScreen'

export interface PlaceSearchBottomSheetProps {
  service?: MapProvider
  center?: Coordinate
  isOpen: boolean
  onClose: () => void
  onSelect: (place: PlaceResult) => void
}

export function PlaceSearchBottomSheet({
  service = 'kakao',
  center,
  isOpen,
  onClose,
  onSelect,
}: PlaceSearchBottomSheetProps) {
  const [keyword, setKeyword] = useState('')
  const searchKeyword = useDebouncedValue(keyword, 300)

  const { data: results, isLoading } = usePlaceSearch({
    keyword: searchKeyword,
    service,
    location: center,
  })

  const [detailKeyword, setDetailKeyword] = useState<string | null>(null)
  const { data: recentKeywords, record, remove } = useLastSearchKeywords()

  const reset = () => {
    setKeyword('')
    setDetailKeyword(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSelect = (place: PlaceResult) => {
    onSelect(place)
    reset()
  }

  const openDetail = (value: string) => {
    Keyboard.dismiss()
    record(value)
    setDetailKeyword(value)
  }

  return (
    <>
      <BottomSheet isOpen={isOpen} onDismiss={handleClose} snapPoints={[0.95]} safeArea>
        <BottomSheet.Header>
          <View style={styles.searchBar}>
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder="장소명을 입력하세요"
              returnKeyType="search"
              autoFocus={isOpen}
              onSubmitEditing={() => {
                if (keyword !== '') openDetail(keyword)
              }}
              style={styles.searchInput}
            />
            <IconButton
              onPress={() => keyword !== '' && openDetail(keyword)}
              style={styles.searchButton}
            >
              <MaterialIcons name="search" size={20} color={palette.text} />
            </IconButton>
          </View>
        </BottomSheet.Header>
        <BottomSheet.Body style={styles.body} onTouchStart={() => Keyboard.dismiss()}>
          {isLoading && <ActivityIndicator style={styles.loading} color={palette.primary} />}

          {!isLoading && results.length === 0 && keyword !== '' && (
            <Typography color="text.secondary" textAlign="center" style={styles.emptyState}>
              검색 결과가 없습니다
            </Typography>
          )}

          {!isLoading && results.length === 0 && keyword === '' && (
            <View style={styles.recommendations}>
              <Typography variant="body2">최근 검색어</Typography>
              <View style={styles.recentSearches}>
                {recentKeywords.map((value) => (
                  <View
                    key={value}
                    style={styles.recentSearchRow}
                  >
                    <Pressable onPress={() => openDetail(value)} style={styles.recentSearchButton}>
                      <Typography variant="body2" color="text.secondary">
                        {value}
                      </Typography>
                    </Pressable>
                    <IconButton size="small" onPress={() => remove(value)}>
                      <MaterialIcons name="close" size={16} color={palette.textSecondary} />
                    </IconButton>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!isLoading && results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(place) => place.externalId}
              contentContainerStyle={styles.resultsContent}
              renderItem={({ item }) => (
                <ListItem.Button onPress={() => handleSelect(item)}>
                  <ListItem.Title>{item.name}</ListItem.Title>
                  {item.address !== '' && <ListItem.Text>{item.address}</ListItem.Text>}
                </ListItem.Button>
              )}
            />
          )}
        </BottomSheet.Body>
      </BottomSheet>

      <BottomSheet
        isOpen={detailKeyword != null}
        onDismiss={() => setDetailKeyword(null)}
        snapPoints={[0.95]}
        safeArea
        backdrop={false}
      >
        <BottomSheet.Header
          rightElement={
            <Pressable onPress={() => setDetailKeyword(null)} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={palette.text} />
            </Pressable>
          }
        >
          {detailKeyword ?? ''}
        </BottomSheet.Header>
        <BottomSheet.Body>
          {detailKeyword != null && (
            <PlaceSearchSelectScreen
              keyword={detailKeyword}
              center={center}
              mapServiceProvider={service}
              onSelect={handleSelect}
            />
          )}
        </BottomSheet.Body>
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, height: 40, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.divider, paddingHorizontal: 12, fontSize: 14, color: palette.text },
  searchButton: { marginLeft: 4 },
  body: { paddingHorizontal: 16 },
  loading: { paddingVertical: 32 },
  emptyState: { paddingVertical: 32 },
  recommendations: { paddingTop: 16 },
  recentSearches: { marginTop: 16, gap: 4 },
  recentSearchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: palette.divider },
  recentSearchButton: { flex: 1, paddingVertical: 10 },
  resultsContent: { gap: 4 },
})
