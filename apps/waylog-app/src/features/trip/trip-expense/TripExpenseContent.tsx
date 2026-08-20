import { formatCurrency, getUsedCurrencies } from '@waylog/domains/expense'
import { useTrip } from '@waylog/domains/trip'
import { useState } from 'react'
import { ScrollView } from 'react-native'
import { Box, Stack, Tab, Tabs, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'
import { ExpenseList } from './ExpenseList'
import { SettlementSummary } from './SettlementSummary'
import { useExpenseSummary } from './useExpenseSummary'

interface Props {
  tripId: string
}

type SubTab = 'list' | 'settlement'

export default function TripExpenseContent({ tripId }: Props) {
  const [currentSubTab, selectSubTab] = useState<SubTab>('list')

  return (
    <Box sx={{ flex: 1, backgroundColor: palette.background }}>
      <ExpenseHeader tripId={tripId} />

      <Tabs value={currentSubTab} onChange={(_, value) => selectSubTab(value as SubTab)}>
        <Tab value="list" label="지출 목록" />
        <Tab value="settlement" label="정산" />
      </Tabs>

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

// 웹 ExpenseHeader.mobile 의 요약 부분이다.
// 환율 편집은 후속으로 남긴다.
function ExpenseHeader({ tripId }: Props) {
  const { data: trip } = useTrip(tripId)
  const { totalInKRW, expenses } = useExpenseSummary(tripId)

  const usedCurrencies = getUsedCurrencies(expenses)

  return (
    <Stack
      direction="row"
      gap={1}
      justifyContent="space-between"
      alignItems="center"
      sx={{ paddingHorizontal: 16, paddingVertical: 12 }}
    >
      <Stack gap={0.5}>
        <Typography variant="caption" color="text.secondary">
          총 지출
        </Typography>
        <Typography variant="h6">{formatCurrency(totalInKRW)}</Typography>
      </Stack>

      {usedCurrencies.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          {usedCurrencies.join(', ')}
        </Typography>
      )}
    </Stack>
  )
}
