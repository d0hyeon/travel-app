import { MaterialIcons } from '@expo/vector-icons'
import { useTrips, type Trip } from '@waylog/domains/modules/trip'
import { ReactNode, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Button, Typography } from '~/shared/components/design-system'
import { LocationThumbnail } from '~features/location/LocationThumbnail'
import { BottomArea } from '../../../../shared/components/BottomArea'
import { palette, radius } from '../../../../shared/config/tokens'

type TripSelection = string | 'none' | null

export function TripStep({ defaultValue, onNext }: { defaultValue: string | null; onNext: (tripId: string | null) => void }) {
  const { data: trips } = useTrips()
  const [selection, setSelection] = useState<TripSelection>(defaultValue)
  const orderedTrips = trips.toSorted((firstTrip, secondTrip) => secondTrip.startDate.localeCompare(firstTrip.startDate))

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <TripSelectionCard
          title="일상 포스트"
          description="여행 없이 피드에만 올려요"
          selected={selection === 'none'}
          onPress={() => setSelection('none')}
          symbol={<MaterialIcons name="auto-awesome" size={22} color={palette.textSecondary} />}
        />
        {orderedTrips.length > 0 && <Typography variant="caption" color="text.secondary" style={styles.tripsLabel}>여행에 묶기 · {orderedTrips.length}개</Typography>}
        {orderedTrips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            selected={selection === trip.id}
            onPress={() => setSelection(trip.id)}

          />
        ))}
      </ScrollView>
      <BottomArea position="static" style={styles.actions}>
        <Button variant="contained" size="large" fullWidth disabled={selection == null} onPress={() => selection != null && onNext(selection === 'none' ? null : selection)}>다음</Button>
      </BottomArea>
    </View>
  )
}

function TripCard({ trip, selected, onPress }: { trip: Trip; selected: boolean; onPress: () => void }) {
  return (
    <TripSelectionCard
      title={trip.name}
      description={formatTripMeta(trip)}
      symbol={<LocationThumbnail location={trip.destinations} width={52} height={52} />}
      selected={selected}
      onPress={onPress}
    />
  )
}

function TripSelectionCard({ title, description, symbol, color = '#F5F5F7', selected, onPress }: { title: string; description: string; symbol?: ReactNode; color?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={[styles.tripOption, { borderColor: selected ? palette.primary : palette.divider, backgroundColor: selected ? '#EEF2FF' : palette.background }]}>
      <View style={[styles.tripSymbol, { backgroundColor: color }]}>
        {symbol}

      </View>
      <View style={styles.tripDetails}><Typography variant="body2" fontWeight="bold">{title}</Typography><Typography variant="caption" color="text.secondary">{description}</Typography></View>
      <MaterialIcons name={selected ? 'check-circle' : 'radio-button-unchecked'} size={22} color={selected ? palette.primary : palette.textSecondary} />
    </Pressable>
  )
}


function formatTripMeta(trip: Trip): string {
  const start = trip.startDate.slice(2).replaceAll('-', '.')
  const end = trip.endDate.slice(2).replaceAll('-', '.')
  const days = Math.max(0, Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000))
  return `${start} – ${end} · ${days === 0 ? '당일' : `${days}박 ${days + 1}일`}`
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 24 },
  tripsLabel: { marginTop: 12 },
  actions: { borderTopWidth: 1, borderTopColor: palette.divider },
  tripOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1.5, borderRadius: radius.lg },
  tripSymbol: { width: 52, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  symbolLabel: { color: '#fff' },
  tripDetails: { flex: 1, gap: 3 },
})
