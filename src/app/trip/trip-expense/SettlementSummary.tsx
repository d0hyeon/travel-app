import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material"
import type { TripMember } from "../trip-member/tripMember.types"
import type { SettlementBalance, SettlementTransaction } from "../../expense/expense.types"
import { formatCurrency } from "../../expense/expense.utils"

interface Props {
  members: TripMember[]
  balances: SettlementBalance[]
  settlements: SettlementTransaction[]
  formatAmount?: (amount: number) => string
}

export function SettlementSummary({ members, balances, settlements, formatAmount = formatCurrency }: Props) {
  const memberMap = new Map(members.map(m => [m.id, m]))

  return (
    <Stack spacing={3}>
      {/* 개인별 잔액 */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
          개인별 정산 현황
        </Typography>
        <Stack spacing={1}>
          {balances.map(({ memberId, balance }) => {
            const member = memberMap.get(memberId)
            if (!member) return null

            return (
              <Card key={memberId} variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography fontSize={24}>{member.emoji}</Typography>
                      <Typography fontWeight="medium">{member.name}</Typography>
                    </Stack>
                    <Box textAlign="right">
                      <Typography
                        variant="h6"
                        color={balance > 0 ? 'success.main' : balance < 0 ? 'error.main' : 'text.secondary'}
                      >
                        {balance > 0 ? '+' : ''}{formatAmount(balance)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {balance > 0 ? '받을 돈' : balance < 0 ? '낼 돈' : '정산 완료'}
                      </Typography>
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
                          <Typography fontSize={20}>{from.emoji}</Typography>
                          <Typography variant="caption">{from.name}</Typography>
                        </Box>
                        <ArrowForwardIcon color="action" fontSize="small" />
                        <Box textAlign="center">
                          <Typography fontSize={20}>{to.emoji}</Typography>
                          <Typography variant="caption">{to.name}</Typography>
                        </Box>
                      </Stack>
                      <Typography variant="h6" color="primary">
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
