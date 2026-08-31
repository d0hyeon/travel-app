import styled from '@emotion/native'
import { createTripPlace, usePlace } from '@waylog/domains/modules/place'
import { useRouter } from 'expo-router'
import { Suspense } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native'
import { Stack, Text } from '../../../shared/components'
import { Button } from '../../../shared/components/mui'
import { Map } from '../../../shared/components/Map'
import { palette, radius } from '../../../shared/config/tokens'
import { useScheduledTrips } from '../../trip/useScheduledTrips'
import { PlacePhotoList } from '../PlacePhotoList'
import { useTripSelectSheet } from '../useTripSelectSheet'

const Backdrop = styled.Pressable`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: flex-end;
`

const Sheet = styled.View`
  background-color: ${palette.background};
  border-top-left-radius: ${radius.xxl}px;
  border-top-right-radius: ${radius.xxl}px;
  padding: 16px;
  gap: 12px;
  max-height: 85%;
`

const MapArea = styled.View`
  height: 180px;
  border-radius: ${radius.md}px;
  overflow: hidden;
`

interface Props {
  placeId: string
  isOpen: boolean
  onClose: () => void
}

// 웹은 모바일에서 풀스크린 모달을 쓰지만, 앱은 지도 위에서 바로 확인하는 흐름이라
// 바텀시트로 띄운다. post·feed 는 explorer/[placeId] 피드 탭으로 진입한다("더 보기").
export function PlaceDetailSheet({ placeId, isOpen, onClose }: Props) {
  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <Backdrop onPress={onClose}>
        {/* 시트 안쪽 탭이 배경으로 전달되지 않도록 막는다 */}
        <Pressable onPress={(event) => event.stopPropagation()}>
          <Sheet>
            <Suspense fallback={<ActivityIndicator />}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <PlaceDetailBody placeId={placeId} />
                <MoreDetailButton placeId={placeId} onNavigate={onClose} />
              </ScrollView>
              <AddTripButton placeId={placeId} onDone={onClose} />
            </Suspense>
          </Sheet>
        </Pressable>
      </Backdrop>
    </Modal>
  )
}

function MoreDetailButton({ placeId, onNavigate }: { placeId: string; onNavigate: () => void }) {
  const router = useRouter()

  return (
    <Pressable
      onPress={() => {
        onNavigate()
        router.push(`/explorer/${placeId}`)
      }}
    >
      <Text variant="body2" color={palette.primary}>
        더 보기
      </Text>
    </Pressable>
  )
}

function AddTripButton({ placeId, onDone }: { placeId: string; onDone: () => void }) {
  const { data: scheduledTrips } = useScheduledTrips()
  const selectTrip = useTripSelectSheet(scheduledTrips)

  if (scheduledTrips.length === 0) return null

  const getTargetTrip = () => {
    if (scheduledTrips.length === 1) return Promise.resolve(scheduledTrips.at(0) ?? null)
    return selectTrip()
  }

  return (
    <Button
      variant="contained"
      size="large"
      fullWidth
      onClick={async () => {
        const targetTrip = await getTargetTrip()
        if (targetTrip == null) return
        await createTripPlace({ placeId, tripId: targetTrip.id })
        onDone()
      }}
    >
      내 여행에 담기
    </Button>
  )
}

// 추천 장소 시트도 같은 내용을 보여준다. 시트 껍데기만 다르다.
export function PlaceDetailBody({ placeId }: { placeId: string }) {
  const { data: place } = usePlace(placeId)

  return (
    <Stack gap={10}>
      <Text variant="h6" bold numberOfLines={1}>
        {place.name}
      </Text>

      <MapArea>
        <Map defaultCenter={{ lat: place.lat, lng: place.lng }}>
          <Map.Marker lat={place.lat} lng={place.lng} label={place.name} />
        </Map>
      </MapArea>

      {place.address != null && place.address !== '' && (
        <Text variant="body2" color={palette.textSecondary}>
          {place.address}
        </Text>
      )}

      <Suspense>
        <PlacePhotoList placeId={place.id} />
      </Suspense>
    </Stack>
  )
}
