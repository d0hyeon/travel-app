import { usePlace } from '@waylog/domains/modules/place'
import { Suspense } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Box, Skeleton, Stack, Typography } from '~shared/components/design-system'
import { Map } from '~shared/components/Map'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { palette, radius } from '~shared/config/tokens'
import { useScheduledTrips } from '~features/trip/useScheduledTrips'
import { AddTripButton } from '~features/place/AddTripButton'
import { PlacePhotoList } from '~features/place/PlacePhotoList'

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
            <Suspense fallback={<PlaceDetailBody.Skeleton />}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <PlaceDetailBody placeId={placeId} />
              </ScrollView>
              <MoreDetailButton placeId={placeId} onNavigate={onClose} />
              <ScheduledAddTripButton placeId={placeId} />
            </Suspense>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function ScheduledAddTripButton({ placeId }: { placeId: string }) {
  const { data: scheduledTrips } = useScheduledTrips()

  if (scheduledTrips.length === 0) return null

  return <AddTripButton placeId={placeId} />
}

function MoreDetailButton({ placeId, onNavigate }: { placeId: string; onNavigate: () => void }) {
  const navigation = useAppNavigation()

  return (
    <Pressable
      onPress={() => {
        onNavigate()
        navigation.navigate(AppRoute.장소_상세, { placeId })
      }}
    >
      <Typography variant="body2" color="primary">
        더 보기
      </Typography>
    </Pressable>
  )
}

// 추천 장소 시트도 같은 내용을 보여준다. 시트 껍데기만 다르다.
export function PlaceDetailBody({ placeId }: { placeId: string }) {
  const { data: place } = usePlace(placeId)

  return (
    <Stack gap={1.25} >

      <View style={styles.mapArea}>
        <Map defaultCenter={{ lat: place.lat, lng: place.lng }}>
          <Map.Marker lat={place.lat} lng={place.lng} label={place.name} />
        </Map>
      </View>

      {place.address != null && place.address !== '' && (
        <Typography variant="body2" color="text.secondary">
          {place.address}
        </Typography>
      )}

      <Suspense fallback={<PlacePhotoList.Skeleton />}>
        <PlacePhotoList placeId={place.id} />
      </Suspense>
    </Stack>
  )
}
PlaceDetailBody.Skeleton = () => {
  return (
    <Stack gap={1.25} >
      <View style={styles.mapArea}>
        <Skeleton width="100%" height="100%" />
      </View>
      <Skeleton width={80} height={20} variant="text" />
      <PlacePhotoList.Skeleton />
    </Stack>
  )
}
