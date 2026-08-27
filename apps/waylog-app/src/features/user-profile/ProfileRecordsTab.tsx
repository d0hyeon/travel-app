import { MaterialIcons } from '@expo/vector-icons'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Map } from '../../shared/components/Map'
import { BottomSheet } from '../../shared/components/bottom-sheet/BottomSheet'
import { Stack, Typography } from '../../shared/components/mui'
import { palette } from '../../shared/config/tokens'
import { visitedRegionMapStyle } from './profile-records.style'
import { useUserTrips } from './useUserTrips'
import { deriveVisitedLocations, type VisitedLocation } from './user-profile.utils'
import { UserTripPhotoList } from './UserTripPhotoList'
import { useOverlay } from '../../shared/hooks/useOverlay'

export function ProfileRecordsTab({ userId, viewportHeight, onMapInteractionChange }: {
  userId: string
  /** 안전 영역을 뺀 화면 높이. 지도가 이 높이를 채운다 */
  viewportHeight: number
  /** 지도를 만지는 동안 바깥 세로 스크롤을 멈추기 위해 알린다 */
  onMapInteractionChange?: (isInteracting: boolean) => void
}) {
  const { data: trips } = useUserTrips(userId)

  // 웹의 calc(100svh - 40px) 과 같다. 탭바를 뺀 만큼을 지도에 준다.
  const mapHeight = Math.max(viewportHeight - TAB_BAR_HEIGHT, 0)
  const visitedLocations = useMemo(() => deriveVisitedLocations(trips), [trips])
  const [selectedLocation, setSelectedLocation] = useState<VisitedLocation | null>(null)
  const [isLocationVisible, setIsLocationVisible] = useState(true)
  const locationOverlay = useOverlay()

  useEffect(() => {
    if (selectedLocation == null) return

    const closeOverlay = locationOverlay.open(({ isOpen, onClose }) => (
      <BottomSheet isOpen={isOpen} snapPoints={[0.6, 0.8]} defaultSnapIndex={0} safeArea onDismiss={onClose}>
        <BottomSheet.Header><LocationMetaInfo value={selectedLocation} /></BottomSheet.Header>
        <BottomSheet.Body sx={{ padding: 16, gap: 16 }}>
          {selectedLocation.trips.map((trip) => (
            <View key={trip.id}>
              <Typography variant="body2" fontWeight="bold">{trip.name}</Typography>
              {/* 사진 조회가 서스펜드해도 루트 경계까지 올라가지 않게 여기서 받는다.
                  올라가면 화면 전체가 다시 마운트되어 지도 위치가 초기화된다. */}
              <Suspense fallback={<Typography variant="caption" color="text.secondary">사진을 불러오는 중…</Typography>}>
                <UserTripPhotoList tripId={trip.id} />
              </Suspense>
            </View>
          ))}
        </BottomSheet.Body>
      </BottomSheet>
    ))

    return () => { void closeOverlay() }
  }, [selectedLocation, locationOverlay])

  if (visitedLocations.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: mapHeight }}>
        <Typography variant="body2" color="text.secondary">아직 방문 기록이 없어요</Typography>
      </Stack>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{ height: mapHeight, backgroundColor: '#EDF2F7' }}
        onStartShouldSetResponderCapture={() => {
          onMapInteractionChange?.(true)
          return false
        }}
        onTouchEnd={() => onMapInteractionChange?.(false)}
        onTouchCancel={() => onMapInteractionChange?.(false)}
      >
        <Pressable onPress={() => setIsLocationVisible((visible) => !visible)} style={{ position: 'absolute', right: 8, top: 8, zIndex: 2, padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.85)' }}>
          <MaterialIcons name={isLocationVisible ? 'visibility' : 'visibility-off'} size={18} color={palette.textSecondary} />
        </Pressable>
        <Map autoFocus="marker" clustering style={visitedRegionMapStyle}>
          {isLocationVisible && visitedLocations.map((visitedLocation) => <Map.Marker key={visitedLocation.location} id={visitedLocation.location} lat={visitedLocation.coordinate.lat} lng={visitedLocation.coordinate.lng} variant="circle" color={selectedLocation?.location === visitedLocation.location ? 'selected' : 'default'} onClick={() => setSelectedLocation((current) => current?.location === visitedLocation.location ? null : visitedLocation)} />)}
        </Map>
      </View>
      <View style={{ padding: 16, gap: 8 }}>
        {visitedLocations.map((visitedLocation) => <Pressable key={visitedLocation.location} onPress={() => setSelectedLocation(visitedLocation)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.divider }}><Stack direction="row" alignItems="center" justifyContent="space-between"><Typography variant="body2" fontWeight="bold">{visitedLocation.location}</Typography><Typography variant="caption" color="text.secondary">{visitedLocation.visitCount}회 방문 · {formatLastVisit(visitedLocation.lastVisitedAt)}</Typography></Stack></Pressable>)}
      </View>
    </View>
  )
}

// 웹의 calc(100svh - 40px) 과 같다. 탭바를 뺀 만큼을 지도에 준다.
const TAB_BAR_HEIGHT = 40

function LocationMetaInfo({ value }: { value: VisitedLocation }) {
  return <Stack direction="row" alignItems="center" sx={{ gap: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary }} /><Typography variant="subtitle1">{value.location}</Typography><Typography variant="caption" color="text.secondary">{value.countryName}</Typography></Stack>
}

function formatLastVisit(isoDate: string): string {
  const [year, month] = isoDate.split('-')
  return `${year ?? ''}.${month ?? ''}`
}
