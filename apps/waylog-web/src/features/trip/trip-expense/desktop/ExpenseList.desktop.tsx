import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography
} from "@mui/material"
import { useMemo } from "react"
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { formatShortDate } from "@waylog/domains/utils"
import { formatByCurrencyCode } from "@waylog/domains/expense"
import { useExpenses } from "../../../expense/useExpenses"
import { useTripMembers } from "../../trip-member/useTripMembers"
import { useExpenseFormOverlay } from "../useExpenseFormOverlay"

interface ExpenseListProps {
  tripId: string;
}
export function ExpenseList({ tripId }: ExpenseListProps) {
  const { data: expenses, update, remove } = useExpenses(tripId);
  const { data: members } = useTripMembers(tripId);
  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

  const expenseFormOverlay = useExpenseFormOverlay(tripId)
  const confirm = useConfirmDialog()


  if (expenses.length === 0) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
          color: 'text.secondary',
          bgcolor: 'grey.50',
          borderRadius: 2,
        }}
      >
        <Typography variant="body1" mb={1}>아직 지출 내역이 없습니다</Typography>
        <Typography variant="body2">지출 추가 버튼을 눌러 첫 지출을 기록해보세요</Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={1.5} sx={{ maxHeight: 450, overflow: 'auto' }}>
      {expenses.map((expense) => {
        const splitedAmount = Math.ceil(expense.totalAmount / members.length);
        const peopleAmount = expense.payments.reduce<Record<string, number>>((acc, item) => ({
          ...acc,
          [item.memberId]: (acc[item.memberId] ?? 0) + item.amount
        }), {});

        const is엔빵 = members.every(member => {
          if (peopleAmount[member.id] == null) return false;
          return peopleAmount[member.id] === splitedAmount;
        })

        return (
          <Card
            key={expense.id}
            variant="outlined"
            sx={{
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
              transition: 'all 0.2s',
              flex: '1 0 auto'
            }}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box flex={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography fontWeight="medium">
                      {!!expense.place && `[${expense.place.name}] `}
                      {expense.description}
                    </Typography>
                    {expense.date && (
                      <Typography variant="caption" color="text.secondary">
                        {formatShortDate(expense.date)}
                      </Typography>
                    )}
                  </Stack>
                  {expense.splitAmong.length < members.length && (
                    <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                      {expense.splitAmong.map(id => {
                        const member = memberMap.get(id);
                        return (
                          <Chip
                            key={id}
                            size="small"
                            variant="outlined"
                            label={`${member?.name}`}
                          />
                        )
                      })}
                    </Stack>
                  )}
                </Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {!is엔빵 && (
                    <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                      {expense.payments.map(p => {
                        const member = memberMap.get(p.memberId)
                        return (
                          <Chip
                            key={p.memberId}
                            size="small"
                            variant="outlined"
                            label={`${member?.name}${p.amount === expense.totalAmount ? '' : ` ${formatByCurrencyCode(p.amount, expense.currency)}`}`}
                          />
                        )
                      })}
                    </Stack>
                  )}
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {formatByCurrencyCode(expense.totalAmount, expense.currency)}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={async () => {
                      const data = await expenseFormOverlay.open({
                        title: '지출 수정',
                        defaultValues: expense
                      });
                      if (data) update({ expenseId: expense.id, data });
                    }}
                    sx={{ height: 30, paddingInline: 2 }}
                  >
                    수정
                  </Button>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      if (await confirm('이 지출을 삭제하시겠습니까?')) {
                        remove(expense.id);
                      }
                    }}
                    sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )
      })}
    </Stack>
  )
}