import styled from '@emotion/native'
import { usePlaceSearch, type PlaceResult } from '@waylog/domains/place'
import { useTrip, useTripPlaces } from '@waylog/domains/trip'
import { useState } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'
import { Stack, Text } from '../../../shared/components'
import { palette, radius } from '../../../shared/config/tokens'

const SearchInput = styled.TextInput`
  height: 40px;
  border-radius: ${radius.lg}px;
  border-width: 1px;
  border-color: ${palette.divider};
  padding-horizontal: 12px;
  font-size: 14px;
`

const ResultRow = styled.Pressable`
  padding: 12px 4px;
  gap: 2px;
`

interface Props {
  tripId: string
  onAdded?: (place: { lat: number; lng: number }) => void
}

export function PlaceSearchScreen({ tripId, onAdded }: Props) {
  const { data: trip } = useTrip(tripId)
  const { create } = useTripPlaces(tripId)

  const [keyword, setKeyword] = useState('')
  const [submitted, setSubmitted] = useState('')

  // 해외 여행은 google, 국내는 kakao 를 쓴다. 웹과 같은 기준이다.
  const { data: results, isLoading, hasNextPage, fetchNextPage } = usePlaceSearch({
    service: trip.isOverseas ? 'google' : 'kakao',
    keyword: submitted,
    location: { lat: trip.lat, lng: trip.lng },
  })

  const add = async (place: PlaceResult) => {
    await create(place)
    onAdded?.(place)
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: palette.background }}>
      <SearchInput
        value={keyword}
        onChangeText={setKeyword}
        placeholder="장소를 검색하세요"
        returnKeyType="search"
        onSubmitEditing={() => setSubmitted(keyword)}
      />

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(place) => `${place.provider}:${place.externalId}`}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            submitted === '' ? null : (
              <Text variant="body2" color={palette.textSecondary}>
                검색 결과가 없습니다
              </Text>
            )
          }
          renderItem={({ item }) => (
            <ResultRow onPress={() => add(item)}>
              <Stack gap={2}>
                <Text variant="body2" bold numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="caption" color={palette.textSecondary} numberOfLines={1}>
                  {item.address}
                </Text>
              </Stack>
            </ResultRow>
          )}
        />
      )}
    </View>
  )
}
