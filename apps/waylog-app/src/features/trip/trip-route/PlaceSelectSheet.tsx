import { StyleSheet, Keyboard, Pressable, TextInput, View } from 'react-native'
import { useTrip, useTripPlaces } from '@waylog/domains/modules/trip'
import { PlaceCategoryColorCode } from '@waylog/domains/modules/place'
import { useState } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '../../../shared/components/ListItem'
import { PlaceSearchSelectScreen } from '../../place/place-search/PlaceSearchSelectScreen'
import { Button, Checkbox, Chip, IconButton, Stack, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../../shared/config/tokens'

interface PlaceSelectSheetProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  selectedPlaceIds: string[]
  onConfirm: (placeIds: string[]) => void
}

export function PlaceSelectSheet({
  isOpen,
  onClose,
  tripId,
  selectedPlaceIds,
  onConfirm,
}: PlaceSelectSheetProps) {
  const { data: trip } = useTrip(tripId)
  const { data: places, create } = useTripPlaces(tripId)

  const [pickedPlaceIds, setPickedPlaceIds] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  // 웹은 Slide 로 전면 오버레이를 띄운다. 앱은 PlaceSearchBottomSheet 와 같은
  // 형제 시트로 옮긴다 — 같은 역할의 앱 표현이 이미 확립돼 있다.
  const [detailKeyword, setDetailKeyword] = useState<string | null>(null)

  const normalizedKeyword = keyword.trim().toLowerCase()
  const isSearching = normalizedKeyword !== ''

  const addablePlaces = places.filter((place) => !selectedPlaceIds.includes(place.id))
  const matchedPlaces = isSearching
    ? addablePlaces.filter(
      (place) =>
        place.name.toLowerCase().includes(normalizedKeyword) ||
        place.address.toLowerCase().includes(normalizedKeyword) ||
        place.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword)),
    )
    : addablePlaces

  const togglePick = (placeId: string) =>
    setPickedPlaceIds((current) =>
      current.includes(placeId) ? current.filter((id) => id !== placeId) : [...current, placeId],
    )

  const pick = (placeId: string) =>
    setPickedPlaceIds((current) => (current.includes(placeId) ? current : [...current, placeId]))

  // 웹은 상세 화면 상단 입력에서 Enter 를 치면 부모 목록의 검색어까지 함께 바뀐다.
  const openDetail = (value: string) => {
    if (value.trim() === '') return
    Keyboard.dismiss()
    setKeyword(value)
    setDetailKeyword(value)
  }

  return (
    <>
      <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.6, 0.9]} defaultSnapIndex={0} safeArea>
        <BottomSheet.Header>장소 선택</BottomSheet.Header>
        <BottomSheet.Body style={styles.sheetBody}>
          <View style={styles.searchBar}>
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder="장소 검색..."
              placeholderTextColor={palette.textSecondary}
              returnKeyType="search"
              onSubmitEditing={() => openDetail(keyword)}
              style={styles.searchInput}
            />
            {isSearching && (
              <IconButton onPress={() => openDetail(keyword)} style={styles.searchButton}>
                <MaterialIcons name="search" size={20} color={palette.text} />
              </IconButton>
            )}
          </View>

          <BottomSheet.ScrollView keyboardShouldPersistTaps="handled">
            {matchedPlaces.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" style={styles.emptyMessage}>
                새로운 장소를 검색해 보세요
              </Typography>
            ) : (
              <Stack gap={0.75}>
                {matchedPlaces.map((place) => {
                  const isPicked = pickedPlaceIds.includes(place.id)

                  return (
                    <ListItem.Button
                      key={place.id}
                      focused={isPicked}
                      onPress={() => togglePick(place.id)}
                      // ListItem.Button 은 leftAddon 을 안쪽 Pressable 바깥에 둔다.
                      // 웹처럼 행 클릭이 버블링되지 않으므로 체크박스도 직접 잇는다.
                      leftAddon={
                        <Checkbox checked={isPicked} size="small" onChange={() => togglePick(place.id)} />
                      }
                    >
                      <Stack direction="row" gap={0.5} alignItems="center">
                        {place.category != null && (
                          <View
                            style={[styles.categoryDot, { backgroundColor: PlaceCategoryColorCode[place.category] }]}
                          />
                        )}
                        <ListItem.Title>{place.name}</ListItem.Title>
                      </Stack>
                      {place.address !== '' && <ListItem.Text>{place.address}</ListItem.Text>}
                      {place.tags.length > 0 && (
                        // Chip 은 onPress 가 없어도 Pressable 을 그린다.
                        // 그대로 두면 태그 영역이 행 선택의 사각지대가 된다.
                        <Stack
                          direction="row"
                          gap={0.5}
                          flexWrap="wrap"
                          style={styles.tags}
                          pointerEvents="none"
                        >
                          {place.tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" />
                          ))}
                        </Stack>
                      )}
                    </ListItem.Button>
                  )
                })}
              </Stack>
            )}
          </BottomSheet.ScrollView>
        </BottomSheet.Body>
        <BottomSheet.BottomActions>
          <Button variant="outlined" fullWidth onPress={onClose}>
            취소
          </Button>
          <Button
            variant="contained"
            fullWidth
            disabled={pickedPlaceIds.length === 0}
            onPress={() => {
              onConfirm(pickedPlaceIds)
              setPickedPlaceIds([])
              setKeyword('')
              onClose()
            }}
          >
            추가 ({pickedPlaceIds.length})
          </Button>
        </BottomSheet.BottomActions>
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
          <TextInput
            defaultValue={detailKeyword ?? ''}
            placeholder="장소 검색..."
            placeholderTextColor={palette.textSecondary}
            returnKeyType="search"
            onSubmitEditing={(event) => openDetail(event.nativeEvent.text)}
            style={styles.searchInput}
          />
        </BottomSheet.Header>
        <BottomSheet.Body>
          {detailKeyword != null && (
            // 지도와 결과 FlatList 가 터치를 독점해야 한다. 감싸지 않으면
            // 스크롤이 시트 드래그로 넘어가 페이지네이션까지 죽는다.
            <BottomSheet.GestureArea>
              <PlaceSearchSelectScreen
                keyword={detailKeyword}
                center={{ lat: trip.lat, lng: trip.lng }}
                mapServiceProvider={trip.isOverseas ? 'google' : 'kakao'}
                onSelect={async (value) => {
                  const { id } = await create(value)
                  pick(id)
                  // 검색어가 남으면 방금 만든 장소가 필터에 걸려 목록에서 사라진다.
                  setKeyword('')
                  setDetailKeyword(null)
                }}
              />
            </BottomSheet.GestureArea>
          )}
        </BottomSheet.Body>
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  sheetBody: { paddingHorizontal: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.divider,
    paddingHorizontal: 12,
    fontSize: 14,
    color: palette.text,
  },
  searchButton: { marginLeft: 4 },
  emptyMessage: { paddingVertical: 24 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  tags: { marginTop: 4 },
})
