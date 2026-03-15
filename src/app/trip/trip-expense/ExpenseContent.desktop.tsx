import AddIcon from '@mui/icons-material/Add'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material"
import { Suspense, useMemo } from "react"
import { useQueryParamState } from '~shared/hooks/useQueryParamState'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { EditableText } from "../../../shared/components/EditableText"
import { formatDate } from "../../../shared/utils/formats"
import {
  calculateBalancesInKRW,
  calculateSettlements,
  formatCurrency,
  getTotalExpensesInKRW
} from "../../expense/expense.utils"
import { convertToKRW, formatByCurrencyCode, getCurrencyByDestination, EXCHANGE_RATES } from "../../expense/currency"
import { useExpenses } from "../../expense/useExpenses"
import { useTripMembers } from "../trip-member/useTripMembers"
import { useTrip } from "../useTrip"
import { RouteExpenseView } from "./RouteExpenseView"
import { useExpenseFormOverlay } from "./useExpenseFormOverlay"

interface Props {
  tripId: string
  defaultCenter: { lat: number; lng: number }
}

type ViewMode = 'list' | 'route'

export function ExpenseContent({ tripId, defaultCenter }: Props) {
  const [viewMode, setViewMode] = useQueryParamState<ViewMode>('espense-view', {
    defaultValue: 'list'
  })

  const { data: trip, update: updateTrip } = useTrip(tripId)
  const { data: expenses, create, update, remove } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)
  const expenseFormOverlay = useExpenseFormOverlay(tripId)
  const confirm = useConfirmDialog()

  const exchangeRate = trip.exchangeRate

  // 원화 환산 기준 계산
  const balances = useMemo(() => calculateBalancesInKRW(members, expenses, exchangeRate), [members, expenses, exchangeRate])
  const settlements = useMemo(() => calculateSettlements(balances), [balances])
  const totalExpensesInKRW = useMemo(() => getTotalExpensesInKRW(expenses, exchangeRate), [expenses, exchangeRate])

  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members])

  const handleAddExpense = async () => {
    const data = await expenseFormOverlay.open({ title: '지출 추가' });
    if (data) create(data);
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (await confirm('이 지출을 삭제하시겠습니까?')) {
      remove(expenseId)
    }
  }

  // 인원 없음
  if (members.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          먼저 기본 정보 탭에서 인원을 추가해주세요
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ flex: 1, p: 3, bgcolor: 'grey.50' }}>
      {/* 상단 요약 카드 */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
        {/* 총 지출 (원화 환산) */}
        <Paper
          elevation={0}
          sx={theme => ({
            p: 3,
            py: 2,
            pb: 1,
            minWidth: 200,
            background: theme.palette.primary.main,
            color: 'white',
            borderRadius: 3,
          })}
        >
          <Typography variant="body2" sx={{ opacity: 0.9 }}>총 지출 (원화 환산)</Typography>
          <Typography variant="h4" fontWeight="bold">
            {formatCurrency(totalExpensesInKRW)}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {expenses.length}건의 지출
          </Typography>
        </Paper>

        {/* 멤버별 잔액 미니 카드 */}
        {balances.map(({ memberId, balance }) => {
          const member = memberMap.get(memberId)
          if (!member) return null
          return (
            <Paper
              key={memberId}
              elevation={0}
              sx={{
                p: 2,
                pb: 1,
                minWidth: 140,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <Typography fontSize={20}>{member.emoji}</Typography>
                <Typography variant="body2" fontWeight="medium">{member.name}</Typography>
              </Stack>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={balance > 0 ? 'success.main' : balance < 0 ? 'error.main' : 'text.secondary'}
              >
                {balance > 0 ? '+' : ''}{formatCurrency(balance)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {balance > 0 ? '받을 돈' : balance < 0 ? '낼 돈' : '정산 완료'}
              </Typography>
            </Paper>
          )
        })}
      </Stack>

      {/* 메인 컨텐츠 */}
      <Stack direction="row" spacing={3}>
        {/* 왼쪽: 지출 목록 */}
        <Paper
          elevation={0}
          sx={{ flex: 2, p: 3, borderRadius: 3, minHeight: 400, display: 'flex', flexDirection: 'column' }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6" fontWeight="bold">지출 내역</Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, v) => v && setViewMode(v)}
                size="small"
              >
                <ToggleButton value="list" sx={{ py: 0.5, px: 1.5 }}>
                  목록
                </ToggleButton>
                <ToggleButton value="route" sx={{ py: 0.5, px: 1.5 }}>
                  장소
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            {viewMode === 'list' && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddExpense}
                sx={{ borderRadius: 2 }}
              >
                지출 추가
              </Button>
            )}
          </Stack>

          {viewMode === 'list' ? (
            // 목록 뷰
            expenses.length === 0 ? (
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
            ) : (
              <Stack spacing={1.5} sx={{ maxHeight: 450, overflow: 'auto' }}>
                {expenses.map((expense) => (
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
                            <Typography fontWeight="medium">{expense.description}</Typography>
                            {expense.date && (
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(expense.date)}
                              </Typography>
                            )}
                          </Stack>
                          <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                            {expense.splitAmong.map(id => {
                              const member = memberMap.get(id);
                              return (
                                <Chip
                                  key={id}
                                  size="small"
                                  variant="outlined"
                                  label={`${member?.emoji} ${member?.name}`}
                                />
                              )
                            })}
                          </Stack>
                        </Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                            {expense.payments.map(p => {
                              const member = memberMap.get(p.memberId)
                              return (
                                <Chip
                                  key={p.memberId}
                                  size="small"
                                  variant="outlined"
                                  label={`${member?.emoji} ${member?.name}${p.amount === expense.totalAmount ? '' : ` ${formatByCurrencyCode(p.amount, expense.currency)}`}`}
                                />
                              )
                            })}
                          </Stack>
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
                            onClick={() => handleDeleteExpense(expense.id)}
                            sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )
          ) : (
            // 경로 뷰
            <Box sx={{ mx: -3, mb: -3, mt: -1 }}>
              <Suspense>
                <RouteExpenseView tripId={tripId} defaultCenter={defaultCenter} />
              </Suspense>
            </Box>
          )}
        </Paper>

        {/* 오른쪽: 정산 현황 */}
        <Paper
          elevation={0}
          sx={{ flex: 1, p: 3, borderRadius: 3, minWidth: 320 }}
        >
          <Typography variant="h6" fontWeight="bold" mb={2}>정산 현황</Typography>

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

          {settlements.length === 0 ? (
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                color: 'text.secondary',
                bgcolor: 'success.50',
                borderRadius: 2,
              }}
            >
              <Typography variant="body1" color="success.main" fontWeight="medium">
                모두 정산 완료!
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                추가 정산이 필요하지 않습니다
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" mb={2}>
                아래와 같이 송금하면 정산이 완료됩니다
              </Typography>
              <Stack spacing={2}>
                {settlements.map((settlement, index) => {
                  const from = memberMap.get(settlement.from)
                  const to = memberMap.get(settlement.to)
                  if (!from || !to) return null

                  return (
                    <Card
                      key={index}
                      variant="outlined"
                      sx={{ bgcolor: 'grey.50' }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box textAlign="center">
                              <Typography fontSize={24}>{from.emoji}</Typography>
                              <Typography variant="caption" fontWeight="medium">
                                {from.name}
                              </Typography>
                            </Box>
                            <ArrowForwardIcon color="action" />
                            <Box textAlign="center">
                              <Typography fontSize={24}>{to.emoji}</Typography>
                              <Typography variant="caption" fontWeight="medium">
                                {to.name}
                              </Typography>
                            </Box>
                          </Stack>
                          <Typography variant="h6" color="primary.main" fontWeight="bold">
                            {formatCurrency(settlement.amount)}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  )
                })}
              </Stack>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          {/* 개인별 상세 */}
          <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
            개인별 상세
          </Typography>
          <Stack spacing={1}>
            {balances.map(({ memberId }) => {
              const member = memberMap.get(memberId)
              if (!member) return null

              // 원화 환산 기준 계산
              const paidInKRW = expenses.reduce((sum, e) => {
                const payment = e.payments.find(p => p.memberId === memberId)
                if (!payment) return sum
                return sum + convertToKRW(payment.amount, e.currency, exchangeRate)
              }, 0)

              const owedInKRW = expenses.reduce((sum, e) => {
                if (e.splitAmong.includes(memberId)) {
                  const totalInKRW = convertToKRW(e.totalAmount, e.currency, exchangeRate)
                  return sum + (totalInKRW / e.splitAmong.length)
                }
                return sum
              }, 0)

              return (
                <Box
                  key={memberId}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'grey.50',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <Typography fontSize={16}>{member.emoji}</Typography>
                    <Typography variant="body2" fontWeight="medium">{member.name}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      지출: {formatCurrency(paidInKRW)} / 분담: {formatCurrency(Math.round(owedInKRW))}
                    </Typography>
                  </Stack>
                </Box>
              )
            })}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}
