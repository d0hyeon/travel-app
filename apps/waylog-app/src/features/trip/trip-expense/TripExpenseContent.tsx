import { useExpenses } from '@waylog/domains/modules/expense'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import { MaterialIcons } from '@expo/vector-icons'
import { Suspense, useState } from 'react'
import { StyleSheet, ScrollView } from 'react-native'
import { Box, MenuFab, Tab, Tabs, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { ExpenseHeader } from './ExpenseHeader'
import { ExpenseList } from './ExpenseList'
import { RouteExpenseView } from './RouteExpenseView'
import { SettlementSummary } from './SettlementSummary'
import { useExpenseFormBottomSheet } from './useExpenseFormOverlay'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { FLOATING_TAB_BAR_RESERVE } from '../../../shared/components'

interface Props {
  tripId: string
}

type SubTab = 'list' | 'settlement'

export default function TripExpenseContent({ tripId }: Props) {
  const [currentSubTab, selectSubTab] = useState<SubTab>('list')
  const { create } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)
  const formBottomSheet = useExpenseFormBottomSheet(tripId)
  const overlay = useOverlay()
  const hasMember = members.length > 0

  const handleAddExpense = async () => {
    const data = await formBottomSheet.open()
    if (data) create(data)
  }

  const handleOpenRouteExpense = () => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onDismiss={close} snapPoints={[0.95]} defaultSnapIndex={0}>
        <BottomSheet.Body>
          <Suspense fallback={null}>
            <RouteExpenseView tripId={tripId} />
          </Suspense>
        </BottomSheet.Body>
      </BottomSheet>
    ))
  }

  return (
    <Box style={styles.container}>
      <ExpenseHeader tripId={tripId} />

      <Tabs fullWidth value={currentSubTab} onChange={(_, value) => selectSubTab(value as SubTab)}>
        <Tab value="list" label="지출 내역" />
        <Tab value="settlement" label="정산" />
      </Tabs>

      {!hasMember ? (
        <Typography color="text.secondary" style={styles.emptyMessage}>
          먼저 기본 정보 탭에서 인원을 추가해주세요
        </Typography>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {currentSubTab === 'list' && <ExpenseList tripId={tripId} />}
          {currentSubTab === 'settlement' && <SettlementSummary tripId={tripId} />}
        </ScrollView>
      )}

      <MenuFab onPress={handleAddExpense} disabled={!hasMember} style={styles.menuFab}>
        <MenuFab.Item
          icon={<MaterialIcons name="add" size={18} color={palette.primary} />}
          onPress={handleAddExpense}
        >
          지출 추가
        </MenuFab.Item>
        <MenuFab.Item
          icon={<MaterialIcons name="route" size={18} color={palette.primary} />}
          onPress={handleOpenRouteExpense}
        >
          경로 기반
        </MenuFab.Item>
      </MenuFab>
    </Box>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  emptyMessage: { padding: 24, textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 16 + FLOATING_TAB_BAR_RESERVE },
  menuFab: { bottom: FLOATING_TAB_BAR_RESERVE },
})
