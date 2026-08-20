import { Delete, Edit } from '@mui/icons-material'
import GroupIcon from '@mui/icons-material/Group'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PaymentIcon from '@mui/icons-material/Payment'
import PlaceIcon from '@mui/icons-material/Place'
import { Stack, Typography } from "@mui/material"
import { useMemo } from "react"
import type { Expense } from "@waylog/domains/expense"
import { formatByCurrencyCode } from "@waylog/domains/expense"
import { useExpenses } from '@waylog/domains/expense'
import { ListItem } from "~shared/components/ListItem"
import { PopMenu } from "~shared/components/PopMenu"
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog"
import { formatShortDate } from "@waylog/domains/utils"
import { useTripMembers } from '@waylog/domains/trip-member'
import { useExpenseFormBottomSheet } from "../useExpenseFormOverlay"

interface Props {
  tripId: string
}

export function ExpenseList({ tripId }: Props) {
  const { data: expenses, update, remove } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)
  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members])

  const formBottomSheet = useExpenseFormBottomSheet(tripId)
  const confirm = useConfirmDialog()

  const handleEditExpense = async (expense: Expense) => {
    const data = await formBottomSheet.open({ defaultValues: expense })
    if (data) update({ expenseId: expense.id, data })
  }

  return (
    <Stack spacing={1.5}>
      {expenses.map((expense) => {
        const splitedAmount = Math.ceil(expense.totalAmount / expense.splitAmong.length)
        const peopleAmount = expense.payments.reduce<Record<string, number>>((acc, item) => ({
          ...acc,
          [item.memberId]: (acc[item.memberId] ?? 0) + item.amount
        }), {})

        const is엔빵 = expense.splitAmong.every(memberId => {
          if (peopleAmount[memberId] == null) return false
          return peopleAmount[memberId] === splitedAmount
        })

        return (
          <ListItem
            key={expense.id}
            rightAddon={
              <PopMenu
                items={[
                  <PopMenu.Item icon={<Edit sx={{ fontSize: '1rem' }} />} onClick={() => handleEditExpense(expense)}>
                    수정
                  </PopMenu.Item>,
                  <PopMenu.Item
                    color="error"
                    icon={<Delete fontSize="small" sx={{ fontSize: '1rem' }} />}
                    onClick={async () => {
                      if (await confirm('삭제하시겠어요?')) {
                        remove(expense.id)
                      }
                    }}
                  >
                    삭제
                  </PopMenu.Item>
                ]}
              >
                <MoreVertIcon fontSize="small" />
              </PopMenu>
            }
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
              <Stack flex={1}>
                <ListItem.Title mb={0.5}>
                  {expense.date && `[${formatShortDate(expense.date)}] `}
                  {expense.description}
                </ListItem.Title>
                {expense.place && (
                  <ListItem.Text leftAddon={<PlaceIcon sx={{ fontSize: 12, width: 14 }} />}>
                    {expense.place.name}
                  </ListItem.Text>
                )}
                {expense.splitAmong.length < members.length && (
                  <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <GroupIcon sx={{ fontSize: 14 }} />
                    {expense.splitAmong.map(id => {
                      const member = memberMap.get(id)
                      return (
                        <ListItem.Text key={id} variant="caption">
                          {member?.name}
                        </ListItem.Text>
                      )
                    })}
                  </Stack>
                )}
              </Stack>
              <Stack direction="row" alignItems="center">
                {!is엔빵 && (
                  <Stack direction="row" gap={0.5} alignItems="center">
                    <PaymentIcon sx={{ fontSize: 12 }} />
                    <Stack>
                      {expense.payments.map(p => {
                        const member = memberMap.get(p.memberId)
                        if (member == null) return null
                        return (
                          <Stack key={p.memberId} direction="row" gap={0.5} justifyContent="space-between" alignItems="center">
                            <ListItem.Text>{member.name}</ListItem.Text>
                            {p.amount !== expense.totalAmount && (
                              <ListItem.Text>
                                {formatByCurrencyCode(p.amount, expense.currency)}
                              </ListItem.Text>
                            )}
                          </Stack>
                        )
                      })}
                    </Stack>
                  </Stack>
                )}
                <Typography variant="body2" color="primary" ml={1}>
                  {formatByCurrencyCode(expense.totalAmount, expense.currency)}
                </Typography>
              </Stack>
            </Stack>
          </ListItem>
        )
      })}
    </Stack>
  )
}
