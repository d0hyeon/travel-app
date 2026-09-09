import { createTripPlace, usePlace } from '@waylog/domains/modules/place'
import { useRouter } from 'expo-router'
import { Suspense } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Button, Stack, Typography } from '~/shared/components/design-system'
import { Map } from '../../../shared/components/Map'
import { palette, radius } from '../../../shared/config/tokens'
import { useScheduledTrips } from '../../trip/useScheduledTrips'
import { PlacePhotoList } from '../PlacePhotoList'
import { useTripSelectSheet } from '../useTripSelectSheet'

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: 16,
    gap: 12,
    maxHeight: '85%',
  },
  mapArea: {
    height: 180,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
})

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
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* 시트 안쪽 탭이 배경으로 전달되지 않도록 막는다 */}
        <Pressable onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheet}>
            <Suspense fallback={<ActivityIndicator />}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <PlaceDetailBody placeId={placeId} />
                <MoreDetailButton placeId={placeId} onNavigate={onClose} />
              </ScrollView>
              <AddTripButton placeId={placeId} onDone={onClose} />
            </Suspense>
          </View>
        </Pressable>
      </Pressable>
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
      <Typography variant="body2" color={palette.primary}>
        더 보기
      </Typography>
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
      onPress={async () => {
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
    <Stack gap={1.25}>

      <View style={styles.mapArea}>
        <Map defaultCenter={{ lat: place.lat, lng: place.lng }}>
          <Map.Marker lat={place.lat} lng={place.lng} label={place.name} />
        </Map>
      </View>

      {place.address != null && place.address !== '' && (
        <Typography variant="body2" color={palette.textSecondary}>
          {place.address}
        </Typography>
      )}

      <Suspense>
        <PlacePhotoList placeId={place.id} />
      </Suspense>
    </Stack>
  )
}
