import { MaterialIcons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { Map } from '../../shared/components/Map'
import { BottomSheet } from '../../shared/components/bottom-sheet/BottomSheet'
import { Stack, Typography } from '../../shared/components/mui'
import { palette } from '../../shared/config/tokens'
import { useUserTrips } from './useUserTrips'
import { deriveVisitedLocations, type VisitedLocation } from './user-profile.utils'
import { UserTripPhotoList } from './UserTripPhotoList'
import { useOverlay } from '../../shared/hooks/useOverlay'

export function ProfileRecordsTab({ userId }: { userId: string }) {
  const { data: trips } = useUserTrips(userId)
  const visitedLocations = useMemo(() => deriveVisitedLocations(trips), [trips])
  const [selectedLocation, setSelectedLocation] = useState<VisitedLocation | null>(null)
  const [isLocationVisible, setIsLocationVisible] = useState(true)
  const locationOverlay = useOverlay()

  useEffect(() => {
    if (selectedLocation == null) return

    const closeOverlay = locationOverlay.open(({ isOpen, onClose }) => (
      <BottomSheet isOpen={isOpen} snapPoints={[0.6, 0.8]} defaultSnapIndex={0} onClose={onClose}>
        <BottomSheet.Header><LocationMetaInfo value={selectedLocation} /></BottomSheet.Header>
        <BottomSheet.Body>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {selectedLocation.trips.map((trip) => (
              <View key={trip.id}>
                <Typography variant="body2" fontWeight="bold">{trip.name}</Typography>
                <UserTripPhotoList tripId={trip.id} />
              </View>
            ))}
          </ScrollView>
        </BottomSheet.Body>
      </BottomSheet>
    ))

    return () => { void closeOverlay() }
  }, [selectedLocation, locationOverlay])

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 420, backgroundColor: '#EDF2F7' }}>
        <Pressable onPress={() => setIsLocationVisible((visible) => !visible)} style={{ position: 'absolute', right: 8, top: 8, zIndex: 2, padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.85)' }}>
          <MaterialIcons name={isLocationVisible ? 'visibility' : 'visibility-off'} size={18} color={palette.textSecondary} />
        </Pressable>
        {visitedLocations.length === 0 ? (
          <Stack flex={1} alignItems="center" justifyContent="center"><Typography variant="body2" color="text.secondary">아직 방문 기록이 없어요</Typography></Stack>
        ) : (
          <Map autoFocus="marker" clustering>
            {isLocationVisible && visitedLocations.map((visitedLocation) => <Map.Marker key={visitedLocation.location} id={visitedLocation.location} lat={visitedLocation.coordinate.lat} lng={visitedLocation.coordinate.lng} variant="circle" color={selectedLocation?.location === visitedLocation.location ? 'selected' : 'default'} onClick={() => setSelectedLocation((current) => current?.location === visitedLocation.location ? null : visitedLocation)} />)}
          </Map>
        )}
      </View>
      <View style={{ padding: 16, gap: 8 }}>
        {visitedLocations.map((visitedLocation) => <Pressable key={visitedLocation.location} onPress={() => setSelectedLocation(visitedLocation)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.divider }}><Stack direction="row" alignItems="center" justifyContent="space-between"><Typography variant="body2" fontWeight="bold">{visitedLocation.location}</Typography><Typography variant="caption" color="text.secondary">{visitedLocation.visitCount}회 방문 · {formatLastVisit(visitedLocation.lastVisitedAt)}</Typography></Stack></Pressable>)}
      </View>
    </View>
  )
}

function LocationMetaInfo({ value }: { value: VisitedLocation }) {
  return <Stack direction="row" alignItems="center" sx={{ gap: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary }} /><Typography variant="subtitle1">{value.location}</Typography><Typography variant="caption" color="text.secondary">{value.countryName}</Typography></Stack>
}

function formatLastVisit(isoDate: string): string {
  const [year, month] = isoDate.split('-')
  return `${year ?? ''}.${month ?? ''}`
}
