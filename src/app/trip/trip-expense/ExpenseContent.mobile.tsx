import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import RouteIcon from '@mui/icons-material/Route'
import { Box, Button, IconButton, Stack, Tab, Tabs, Typography } from "@mui/material"
import { Suspense, useMemo, useState } from "react"
import type { Expense } from '~app/expense/expense.types'
import { BottomSheet } from "../../../shared/components/BottomSheet"
import { EditableText } from "../../../shared/components/EditableText"
import { ListItem } from "../../../shared/components/ListItem"
import { useOverlay } from "../../../shared/hooks/useOverlay"
import { formatDate } from "../../../shared/utils/formats"
import {
  calculateBalancesInKRW,
  calculateSettlements,
  formatCurrency,
  getTotalExpensesInKRW
} from "../../expense/expense.utils"
import { formatByCurrencyCode, getCurrencyByDestination, EXCHANGE_RATES } from "../../expense/currency"
import { useExpenses } from "../../expense/useExpenses"
import { useTripMembers } from "../trip-member/useTripMembers"
import { useTrip } from "../useTrip"
import { ExpenseFormDeletationActions } from './ExpenseFormDeletationActions'
import { RouteExpenseViewMobile } from "./RouteExpenseView.mobile"
import { SettlementSummary } from "./SettlementSummary"
import { useExpenseFormBottomSheet } from './useExpenseFormOverlay'

interface Props {
  tripId: string
}

type SubTab = 'list' | 'settlement'

export function ExpenseContent({ tripId }: Props) {
  const { data: trip, update: updateTrip } = useTrip(tripId)
  const { data: expenses, create, update } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId);

  const overlay = useOverlay()
  const [subTab, setSubTab] = useState<SubTab>('list')

  const handleOpenRouteExpense = () => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet
        isOpen={isOpen}
        onClose={close}
        snapPoints={[0.95]}
        defaultSnapIndex={0}
      >
        <Suspense>
          <RouteExpenseViewMobile tripId={tripId} />
        </Suspense>
      </BottomSheet>
    ))
  }

  const exchangeRate = trip.exchangeRate

  // 원화 환산 기준 계산
  const balances = useMemo(() => calculateBalancesInKRW(members, expenses, exchangeRate), [members, expenses, exchangeRate])
  const settlements = useMemo(() => calculateSettlements(balances), [balances])
  const totalExpensesInKRW = useMemo(() => getTotalExpensesInKRW(expenses, exchangeRate), [expenses, exchangeRate])

  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members])

  const formBottomSheet = useExpenseFormBottomSheet(tripId);
  const handleAddExpense = async () => {
    const data = await formBottomSheet.open();
    if (data) create(data)
  }
  const handleEditExpense = async (expense: Expense) => {
    const data = await formBottomSheet.open({
      defaultValues: expense,
      renderActions: ({ close }) => (
        <ExpenseFormDeletationActions tripId={tripId} expenseId={expense.id} onClose={close} />
      )
    });
    if (data) update({ expenseId: expense.id, data });
  }


  return (
    <Box sx={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* 총액 표시 (원화 환산) */}
      <Box flex="0 0 auto" sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="caption">총 지출 (원화 환산)</Typography>
        <Typography variant="h5" fontWeight="bold">
          {formatCurrency(totalExpensesInKRW)}
        </Typography>
      </Box>

      {/* 서브 탭 */}
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
          flex: '0 0 auto',
          zIndex: 10
        }}
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
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, height: '100%' }}>
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
                        <Stack direction="row" >
                          <IconButton
                            size="small"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                        <Box flex={1}>
                          <ListItem.Title>
                            {expense.date && `[${formatDate(expense.date)}] `}
                            {expense.description}
                          </ListItem.Title>
                          <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                            {expense.splitAmong.map(id => {
                              const member = memberMap.get(id);
                              return (
                                <ListItem.Text key={id} variant="caption">
                                  {member?.emoji} {member?.name}
                                </ListItem.Text>
                              )
                            })}
                          </Stack>
                        </Box>
                        <Stack direction="row" alignItems="center">
                          <Stack>
                            {expense.payments.map(p => {
                              const member = memberMap.get(p.memberId);
                              if (member == null) return null;

                              return (
                                <Stack key={p.memberId} direction="row" gap={0.5} justifyContent="space-between" alignItems="center">
                                  <ListItem.Text>
                                    {member.emoji} {member.name}
                                  </ListItem.Text>
                                  {p.amount !== expense.totalAmount && (
                                    <ListItem.Text>
                                      {formatByCurrencyCode(p.amount, expense.currency)}
                                    </ListItem.Text>
                                  )}
                                </Stack>
                              )
                            })}
                          </Stack>
                          <Typography variant="body2" color="primary" ml={1}>
                            {formatByCurrencyCode(expense.totalAmount, expense.currency)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </ListItem>
                  ))}
                </Stack>
              )}
            </>
          )}

          {subTab === 'settlement' && (
            <>
              {/* 해외 여행일 때 환율 설정 */}
              {trip.isOverseas && (() => {
                const currency = getCurrencyByDestination(trip.destination)
                const defaultRate = Math.round(1 / (EXCHANGE_RATES[currency.code] || 1))
                return (
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        환율 (1{currency.name})
                      </Typography>
                      <EditableText
                        variant="body2"
                        fontWeight="medium"
                        value={exchangeRate ? `${exchangeRate.toLocaleString()}원` : `${defaultRate.toLocaleString()}원 (기본)`}
                        onSubmit={(value) => {
                          const rate = Number(value.replace(/[^0-9.]/g, ''))
                          if (rate > 0) {
                            updateTrip.mutateAsync({ exchangeRate: rate })
                          }
                        }}
                        submitOnBlur
                      />
                    </Stack>
                  </Box>
                )
              })()}
              <SettlementSummary
                members={members}
                balances={balances}
                settlements={settlements}
              />
            </>
          )}
        </Box>
      )}

      {/* 하단 버튼 */}
      <Stack direction="row" spacing={1} p={1}>
        <Button
          size="large"
          variant="outlined"
          onClick={handleOpenRouteExpense}
          startIcon={<RouteIcon />}
          disabled={members.length === 0}
          sx={{ flex: 1 }}
        >
          경로 기반
        </Button>
        <Button
          size="large"
          variant="contained"
          onClick={handleAddExpense}
          startIcon={<AddIcon />}
          disabled={members.length === 0}
          sx={{ flex: 1 }}
        >
          지출 추가
        </Button>
      </Stack>
    </Box>
  )
}
