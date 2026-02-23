import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Button, Chip, IconButton, Stack, Tab, Tabs, Typography } from "@mui/material"
import { useMemo, useState } from "react"
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { DraggableBottomSheet } from "../../../shared/components/DraggableBottomSheet"
import { ListItem } from "../../../shared/components/ListItem"
import { useOverlay } from "../../../shared/hooks/useOverlay"
import { formatDate } from "../../../shared/utils/formats"
import {
  calculateBalances,
  calculateSettlements,
  formatCurrency,
  getTotalExpenses
} from "../../expense/expense.utils"
import { useExpenses } from "../../expense/useExpenses"
import { useTripMembers } from "../../trip-member/useTripMembers"
import { ExpenseForm } from "./ExpenseForm"
import { SettlementSummary } from "./SettlementSummary"

interface Props {
  tripId: string
}

type SubTab = 'list' | 'settlement'

export function ExpenseContent({ tripId }: Props) {
  const { data: expenses, create, remove } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)
  const overlay = useOverlay()
  const confirm = useConfirmDialog()

  const [subTab, setSubTab] = useState<SubTab>('list')

  const balances = useMemo(() => calculateBalances(members, expenses), [members, expenses])
  const settlements = useMemo(() => calculateSettlements(balances), [balances])
  const totalExpenses = useMemo(() => getTotalExpenses(expenses), [expenses])

  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members])

  const handleAddExpense = () => {
    overlay.open(({ isOpen, close }) => (
      <DraggableBottomSheet
        isOpen={isOpen}
        onClose={close}
        snapPoints={[0.9]}
        defaultSnapIndex={0}
      >
        <ExpenseForm
          tripId={tripId}
          padding={2}
          onSubmit={(data) => {
            create(data)
            close()
          }}
          action={(
            <Stack position="absolute" marginLeft="-16px !important" padding={2} bottom={0} width="100%" direction="row" gap={1} >
              <Button type="button" onClick={close} size="large" variant="outlined" fullWidth>취소</Button>
              <ExpenseForm.SubmitButton size="large" fullWidth />
            </Stack>
          )}
        />
      </DraggableBottomSheet>
    ))
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (await confirm('이 지출을 삭제하시겠습니까?')) {
      remove(expenseId)
    }
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* 총액 표시 */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="caption">총 지출</Typography>
        <Typography variant="h5" fontWeight="bold">
          {formatCurrency(totalExpenses)}
        </Typography>
      </Box>

      {/* 서브 탭 */}
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="지출 내역" value="list" />
        <Tab label="정산" value="settlement" />
      </Tabs>

      {/* 인원 없음 경고 */}
      {members.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Typography color="text.secondary" textAlign="center">
            먼저 기본 정보 탭에서 인원을 추가해주세요
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {subTab === 'list' && (
            <>
              {expenses.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  지출 내역이 없습니다
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {expenses.map((expense) => (
                    <ListItem
                      key={expense.id}
                      rightAddon={
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteExpense(expense.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <ListItem.Title>{expense.description}</ListItem.Title>
                          <ListItem.Text color="text.secondary">
                            {formatDate(expense.date)}
                          </ListItem.Text>
                          <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                            {expense.payments.map(p => {
                              const member = memberMap.get(p.memberId)
                              return (
                                <Chip
                                  key={p.memberId}
                                  size="small"
                                  label={`${member?.emoji} ${p.amount.toLocaleString()}원`}
                                />
                              )
                            })}
                          </Stack>
                        </Box>
                        <Typography variant="h6" color="primary" ml={1}>
                          {formatCurrency(expense.totalAmount)}
                        </Typography>
                      </Stack>
                    </ListItem>
                  ))}
                </Stack>
              )}
            </>
          )}

          {subTab === 'settlement' && (
            <SettlementSummary
              members={members}
              balances={balances}
              settlements={settlements}
            />
          )}
        </Box>
      )}

      {/* 지출 추가 버튼 */}
      <Box p={1}>
        <Button
          size="large"
          variant="contained"
          onClick={handleAddExpense}
          startIcon={<AddIcon />}
          fullWidth
          disabled={members.length === 0}
        >
          지출 추가
        </Button>
      </Box>
    </Box>
  )
}
