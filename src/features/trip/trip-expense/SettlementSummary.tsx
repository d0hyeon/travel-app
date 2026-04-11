import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material"
import { useMemo } from 'react'
import { convertToKRW } from '~features/expense/currency'
import { useExpenses } from '~features/expense/useExpenses'
import { calculateBalancesInKRW, calculateSettlements, formatCurrency } from "../../expense/expense.utils"
import { MemberAvatar } from '../trip-member/MemberAvatar'
import { useTripMembers } from '../trip-member/useTripMembers'
import { useTrip } from '../useTrip'

interface Props {
  tripId: string;
  formatAmount?: (amount: number) => string
}

export function SettlementSummary({ tripId, formatAmount = formatCurrency }: Props) {
  const { data: { exchangeRates } } = useTrip(tripId)
  const { data: expenses } = useExpenses(tripId);
  const { data: members } = useTripMembers(tripId)
  const memberMap = new Map(members.map(m => [m.id, m]))
  const balances = useMemo(() => calculateBalancesInKRW(members, expenses, exchangeRates), [members, expenses, exchangeRates])
  const settlements = useMemo(() => calculateSettlements(balances), [balances])

  const memberPaidMap = new Map(
    balances.map(({ memberId }) => {
      const paidInKRW = expenses.reduce((sum, e) => {
        const payment = e.payments.find(p => p.memberId === memberId)
        if (!payment) return sum
        return sum + convertToKRW(payment.amount, e.currency, exchangeRates)
      }, 0)
      const fairShare = expenses.reduce((sum, e) => {
        if (!e.splitAmong.includes(memberId)) return sum
        return sum + convertToKRW(e.totalAmount, e.currency, exchangeRates) / e.splitAmong.length
      }, 0)
      return [memberId, { paidInKRW, fairShare }]
    })
  )

  return (
    <Stack spacing={3}>
      {/* 개인별 잔액 */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
          개인별 정산 현황
        </Typography>
        <Stack spacing={1}>
          {balances.map(({ memberId, balance, }) => {
            const member = memberMap.get(memberId)

            if (!member) return null;
            const { paidInKRW, fairShare } = memberPaidMap.get(memberId) ?? { paidInKRW: 0, fairShare: 0 }

            return (
              <Card key={memberId} variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <MemberAvatar member={member} size={24} />
                      <Typography variant='body2' fontWeight="medium">{member.user.name}</Typography>
                    </Stack>
                    <Box textAlign="left">
                      <Stack gap={0.5} minWidth={150}>
                        <Stack direction="row" gap={2} justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            지출금
                          </Typography>
                          <Typography variant="body2">
                            {formatCurrency(paidInKRW)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" gap={2} justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">
                            정산금
                          </Typography>
                          <Typography
                            variant="body2"
                            color={balance > 0 ? 'primary.main' : balance < 0 ? 'error.main' : 'text.secondary'}
                          >
                            {balance > 0 ? '+' : ''}{formatAmount(balance)}
                          </Typography>
                        </Stack>
                        <Divider />
                        <Stack direction="row" gap={2} justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary" fontWeight="medium">
                            총 지출금
                          </Typography>
                          <Typography variant="body2">
                            {formatCurrency(Math.round(fairShare))}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      </Box>

      <Divider />

      {/* 정산 방법 */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
          이렇게 정산하세요
        </Typography>
        {settlements.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={2}>
            정산할 내역이 없습니다
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {settlements.map((settlement, index) => {
              const from = memberMap.get(settlement.from)
              const to = memberMap.get(settlement.to)
              if (!from || !to) return null

              return (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box textAlign="center">
                          <Typography variant="caption">{from.user.name}</Typography>
                        </Box>
                        <ArrowForwardIcon color="action" fontSize="small" />
                        <Box textAlign="center">
                          <Typography variant="caption">{to.user.name}</Typography>
                        </Box>
                      </Stack>
                      <Typography variant="body2" color="primary">
                        {formatAmount(settlement.amount)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
