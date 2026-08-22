import { useExpenses } from '@waylog/domains/modules/expense'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import { MaterialIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { ScrollView } from 'react-native'
import { Box, Button, Stack, Tab, Tabs, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { ExpenseHeader } from './ExpenseHeader'
import { ExpenseList } from './ExpenseList'
import { RouteExpenseView } from './RouteExpenseView'
import { SettlementSummary } from './SettlementSummary'
import { useExpenseFormBottomSheet } from './useExpenseFormOverlay'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { TripDetailHeader } from '../components/TripDetailHeader'

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
    if (!hasMember) return
    const data = await formBottomSheet.open()
    if (data) create(data)
  }

  const handleOpenRouteExpense = () => {

    if (!hasMember) return
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onDismiss={close} snapPoints={[0.95]} defaultSnapIndex={0}>
        <BottomSheet.Body>
          <RouteExpenseView tripId={tripId} />
        </BottomSheet.Body>
      </BottomSheet>
    ))
  }

  return (
    <Box sx={{ flex: 1, backgroundColor: palette.background }}>
      <TripDetailHeader />
      <ExpenseHeader tripId={tripId} />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Tabs value={currentSubTab} onChange={(_, value) => selectSubTab(value as SubTab)}>
          <Tab value="list" label="지출 내역" />
          <Tab value="settlement" label="정산" />
        </Tabs>
      </Stack>

      {!hasMember ? (
        <Typography color="text.secondary" sx={{ padding: 24, textAlign: 'center' }}>
          먼저 기본 정보 탭에서 인원을 추가해주세요
        </Typography>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {currentSubTab === 'list' && <ExpenseList tripId={tripId} />}
          {currentSubTab === 'settlement' && <SettlementSummary tripId={tripId} />}
        </ScrollView>
      )}

      <Stack direction="row" gap={1} sx={{ padding: 8 }}>
        <Button
          size="large"
          variant="outlined"
          disabled={!hasMember}
          onClick={handleOpenRouteExpense}
          startIcon={<MaterialIcons name="route" size={18} color="#4C84FF" />}
          sx={{ flex: 1 }}
        >
          경로 기반
        </Button>
        <Button
          size="large"
          variant="contained"
          disabled={!hasMember}
          onClick={handleAddExpense}
          startIcon={<MaterialIcons name="add" size={18} color="#fff" />}
          sx={{ flex: 1 }}
        >
          지출 추가
        </Button>
      </Stack>
    </Box>
  )
}
