import { useExpenses } from '@waylog/domains/modules/expense'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
import { MaterialIcons } from '@expo/vector-icons'
import { Suspense, useState } from 'react'
import { ScrollView } from 'react-native'
import { Box, Button, Stack, Tab, Tabs, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { ExpenseHeader } from './ExpenseHeader'
import { ExpenseList } from './ExpenseList'
import { RouteExpenseView } from './RouteExpenseView'
import { SettlementSummary } from './SettlementSummary'
import { useExpenseFormBottomSheet } from './useExpenseFormOverlay'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { useOverlay } from '../../../shared/hooks/useOverlay'

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
    <Box style={{ flex: 1, backgroundColor: palette.background }}>
      <ExpenseHeader tripId={tripId} />

      <Tabs fullWidth value={currentSubTab} onChange={(_, value) => selectSubTab(value as SubTab)}>
        <Tab value="list" label="지출 내역" />
        <Tab value="settlement" label="정산" />
      </Tabs>

      {!hasMember ? (
        <Typography color="text.secondary" style={{ padding: 24, textAlign: 'center' }}>
          먼저 기본 정보 탭에서 인원을 추가해주세요
        </Typography>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {currentSubTab === 'list' && <ExpenseList tripId={tripId} />}
          {currentSubTab === 'settlement' && <SettlementSummary tripId={tripId} />}
        </ScrollView>
      )}

      <Stack direction="row" gap={1} style={{ padding: 8 }}>
        <Button
          size="large"
          variant="outlined"
          disabled={!hasMember}
          onPress={handleOpenRouteExpense}
          startIcon={<MaterialIcons name="route" size={18} color="#4C84FF" />}
          style={{ flex: 1 }}
        >
          경로 기반
        </Button>
        <Button
          size="large"
          variant="contained"
          disabled={!hasMember}
          onPress={handleAddExpense}
          startIcon={<MaterialIcons name="add" size={18} color="#fff" />}
          style={{ flex: 1 }}
        >
          지출 추가
        </Button>
      </Stack>
    </Box>
  )
}
