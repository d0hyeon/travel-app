import styled from '@emotion/native'
import { convertToKRW, formatCurrency, useExpenses } from '@waylog/domains/expense'
import { useMemo } from 'react'
import { FlatList, View } from 'react-native'
import { Stack, Text } from '../../../shared/components'
import { palette, radius } from '../../../shared/config/tokens'

const Row = styled.View`
  padding: 12px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${palette.divider};
  gap: 2px;
`

interface Props {
  tripId: string
}

export function TripExpenseContent({ tripId }: Props) {
  const { data: expenses } = useExpenses(tripId)

  // 통화가 섞여 있으므로 원화로 환산해 더한다.
  const totalKRW = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) => sum + convertToKRW(expense.totalAmount, expense.currency),
        0,
      ),
    [expenses],
  )

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: palette.background }}>
      <Stack gap={4}>
        <Text variant="caption" color={palette.textSecondary}>
          총 지출
        </Text>
        <Text variant="h6" bold>
          {formatCurrency(totalKRW)}
        </Text>
      </Stack>

      <FlatList
        data={expenses}
        keyExtractor={(expense) => expense.id}
        contentContainerStyle={{ paddingTop: 12, gap: 8 }}
        ListEmptyComponent={
          <Text variant="body2" color={palette.textSecondary}>
            지출이 없습니다
          </Text>
        }
        renderItem={({ item }) => (
          <Row>
            <Stack direction="row" justify="space-between" align="center">
              <Text variant="body2" bold numberOfLines={1}>
                {item.description}
              </Text>
              <Text variant="body2">
                {item.totalAmount.toLocaleString()} {item.currency}
              </Text>
            </Stack>
            <Text variant="caption" color={palette.textSecondary}>
              {item.date}
            </Text>
          </Row>
        )}
      />
    </View>
  )
}
