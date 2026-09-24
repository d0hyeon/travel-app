import { Suspense } from 'react'
import { useAppRoute } from '../../../shared/hooks/useAppNavigation'
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native'
import { TripChecklist } from './TripChecklist'
import { palette } from '../../../shared/config/tokens'
import { FLOATING_TAB_BAR_RESERVE } from '../../../shared/components'

export function TripDetailChecklistScreen() {
  const { params } = useAppRoute<'TripDetailChecklist'>()

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Suspense fallback={<ActivityIndicator style={styles.fill} />}>
        <TripChecklist tripId={params.tripId} />
      </Suspense>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  fill: { flex: 1 },
  content: { padding: 16, paddingBottom: 16 + FLOATING_TAB_BAR_RESERVE },
})
