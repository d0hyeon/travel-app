import { Box, Stack, Typography } from "@mui/material";
import { convertToKRW } from "@waylog/domains/expense";
import { formatCurrency } from "@waylog/domains/expense";
import { MemberAvatar } from "~features/trip/trip-member/MemberAvatar";
import { useExpenseSummary } from "../useExpenseSummary";

interface Props {
  tripId: string;
}
export function ExpenseMemberSettlements({ tripId }: Props) {
  const { balances, members, expenses, exchangeRates } = useExpenseSummary(tripId)

  return (
    <Stack spacing={1} >
      {balances.map(({ memberId }) => {
        const member = members.find(x => x.id === memberId)
        if (!member) return null

        // 원화 환산 기준 계산
        const paidInKRW = expenses.reduce((sum, e) => {
          const payment = e.payments.find(p => p.memberId === memberId)
          if (!payment) return sum
          return sum + convertToKRW(payment.amount, e.currency, exchangeRates)
        }, 0)

        const owedInKRW = expenses.reduce((sum, e) => {
          if (e.splitAmong.includes(memberId)) {
            const totalInKRW = convertToKRW(e.totalAmount, e.currency, exchangeRates)
            return sum + (totalInKRW / e.splitAmong.length)
          }
          return sum
        }, 0)

        return (
          <Box
            key={memberId}
            p={1.5}
            sx={{ borderRadius: 1, bgcolor: 'grey.50' }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <MemberAvatar member={member} size={24} />
              <Typography variant="body2" fontWeight="medium">{member.name}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                지출: {formatCurrency(paidInKRW)} / 분담: {formatCurrency(Math.round(owedInKRW))}
              </Typography>
            </Stack>
          </Box>
        )
      })
      }
    </Stack >
  )
}