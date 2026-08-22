import { usePlaceSearch, type PlaceResult } from '@waylog/domains/modules/place'
import type { Coordinate, MapProvider } from '@waylog/domains/modules/map'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Modal, Pressable, TextInput } from 'react-native'
import { palette, radius } from '../../../shared/config/tokens'
import { Box, Stack, Typography } from '../../../shared/components/mui'
import { ListItem } from '../../../shared/components/ListItem'

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
  const [submitted, setSubmitted] = useState('')

  const { data: results, isLoading, hasNextPage, fetchNextPage } = usePlaceSearch({
    service,
    keyword: submitted,
    location: center,
  })

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <Box sx={{ flex: 1, backgroundColor: palette.background, paddingTop: 60, padding: 16 }}>
        <Stack direction="row" gap={1} alignItems="center" sx={{ marginBottom: 12 }}>
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="장소를 검색하세요"
            returnKeyType="search"
            autoFocus
            onSubmitEditing={() => setSubmitted(keyword)}
            style={{
              flex: 1,
              height: 40,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: palette.divider,
              paddingHorizontal: 12,
              fontSize: 14,
            }}
          />
          <Pressable onPress={onClose}>
            <Typography variant="body2" color="text.secondary">
              닫기
            </Typography>
          </Pressable>
        </Stack>

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(place) => `${place.provider}:${place.externalId}`}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ gap: 8 }}
            ListEmptyComponent={
              submitted === '' ? null : (
                <Typography variant="body2" color="text.secondary">
                  검색 결과가 없습니다
                </Typography>
              )
            }
            renderItem={({ item }) => (
              <ListItem.Button onClick={() => onSelect(item)}>
                <ListItem.Title>{item.name}</ListItem.Title>
                {item.address !== '' && <ListItem.Text>{item.address}</ListItem.Text>}
              </ListItem.Button>
            )}
          />
        )}
      </Box>
    </Modal>
  )
}
