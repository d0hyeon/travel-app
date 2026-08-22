import { MaterialIcons } from '@expo/vector-icons'
import { Stack, Typography } from "../../../shared/components/mui"
import { useMemo } from "react"
import type { Expense } from "@waylog/domains/expense"
import { formatByCurrencyCode } from "@waylog/domains/expense"
import { useExpenses } from '@waylog/domains/expense'
import { ListItem } from "../../../shared/components/ListItem"
import { PopMenu } from "../../../shared/components/PopMenu"
import { useConfirmDialog } from "../../../shared/components/confirm-dialog/useConfirmDialog"
import { useExpenseFormBottomSheet } from "./useExpenseFormOverlay"
import { formatShortDate } from "@waylog/utility"
import { useTripMembers } from '@waylog/domains/trip-member'

interface Props {
  tripId: string
}

export function ExpenseList({ tripId }: Props) {
  const { data: expenses, update, remove } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)
  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members])

  const confirm = useConfirmDialog()
  const formBottomSheet = useExpenseFormBottomSheet(tripId)

  const handleEditExpense = async (expense: Expense) => {
    const data = await formBottomSheet.open({ defaultValues: expense, mode: 'edit' })
    if (data) update({ expenseId: expense.id, data })
  }

  return (
    <Stack gap={1.5}>
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
                  <PopMenu.Item key="edit" icon={<MaterialIcons name="edit" size={18} />} onClick={() => handleEditExpense(expense)}>
                    수정
                  </PopMenu.Item>,
                  <PopMenu.Item
                    key="delete"
                    color="error"
                    icon={<MaterialIcons name="delete" size={18} color="#d32f2f" />}
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
                <MaterialIcons name="more-vert" size={18} color="#787c7e" />
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
                  <ListItem.Text leftAddon={<MaterialIcons name="place" size={14} color="#787c7e" />}>
                    {expense.place.name}
                  </ListItem.Text>
                )}
                {expense.splitAmong.length < members.length && (
                  <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <MaterialIcons name="group" size={14} color="#787c7e" />
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
                    <MaterialIcons name="payment" size={14} color="#787c7e" />
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
