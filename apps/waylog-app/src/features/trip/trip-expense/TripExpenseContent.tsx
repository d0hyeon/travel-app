import { useExpenses } from '@waylog/domains/expense'
import { useState } from 'react'
import { ScrollView } from 'react-native'
import { Box, Button, Stack, Tab, Tabs, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { ExpenseHeader } from './ExpenseHeader'
import { ExpenseList } from './ExpenseList'
import { SettlementSummary } from './SettlementSummary'
import { useExpenseFormBottomSheet } from './useExpenseFormOverlay'

interface Props {
  tripId: string
}

type SubTab = 'list' | 'settlement'

export default function TripExpenseContent({ tripId }: Props) {
  const [currentSubTab, selectSubTab] = useState<SubTab>('list')
  const { create } = useExpenses(tripId)
  const formBottomSheet = useExpenseFormBottomSheet(tripId)

  const handleAddExpense = async () => {
    const data = await formBottomSheet.open()
    if (data) create(data)
  }

  return (
    <Box sx={{ flex: 1, backgroundColor: palette.background }}>
      <ExpenseHeader tripId={tripId} />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Tabs value={currentSubTab} onChange={(_, value) => selectSubTab(value as SubTab)}>
          <Tab value="list" label="지출 목록" />
          <Tab value="settlement" label="정산" />
        </Tabs>
        <Button
          size="small"
          variant="contained"
          onClick={handleAddExpense}
          sx={{ marginRight: 16 }}
        >
          지출 추가
        </Button>
      </Stack>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {currentSubTab === 'list' ? (
          <ExpenseList tripId={tripId} />
        ) : (
          <SettlementSummary tripId={tripId} />
        )}
      </ScrollView>
    </Box>
  )
}
