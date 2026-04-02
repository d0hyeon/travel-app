import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DeleteIcon from '@mui/icons-material/Delete'
import SettingsIcon from '@mui/icons-material/Settings'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material"
import { Suspense, useMemo, useState } from "react"
import { ListItem } from '~shared/components/ListItem'
import { useOverlay } from '~shared/hooks/useOverlay'
import { useQueryParamState } from '~shared/hooks/useQueryParamState'
import { DialogTitle } from '~shared/modules/confirm-dialog/DialogTitle'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { EditableText } from "../../../shared/components/EditableText"
import { formatDate } from "../../../shared/utils/formats"
import { convertToKRW, formatByCurrencyCode, getCurrencyName, getDefaultExchangeRate, getExchangeRate, getUsedCurrencies, setExchangeRate, type CurrencyCode } from "../../expense/currency"
import {
  calculateBalancesInKRW,
  calculateSettlements,
  formatCurrency,
  getTotalExpensesInKRW
} from "../../expense/expense.utils"
import { useExpenses } from "../../expense/useExpenses"
import { useTripMembers } from "../trip-member/useTripMembers"
import { useTrip } from "../useTrip"
import { RouteExpenseView } from "./RouteExpenseView"
import { useExpenseFormOverlay } from "./useExpenseFormOverlay"
import { AnimatedCountText } from './AnimatedCountText'

interface Props {
  tripId: string
}

type ViewMode = 'list' | 'route'

export function ExpenseContent({ tripId }: Props) {
  const [viewMode, setViewMode] = useQueryParamState<ViewMode>('espense-view', {
    defaultValue: 'list'
  })

  const { data: trip, update: updateTrip } = useTrip(tripId)
  const { data: expenses, create, update, remove } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)
  const expenseFormOverlay = useExpenseFormOverlay(tripId)
  const confirm = useConfirmDialog()

  const exchangeRates = trip.exchangeRates

  // 원화 환산 기준 계산
  const balances = useMemo(() => calculateBalancesInKRW(members, expenses, exchangeRates), [members, expenses, exchangeRates])
  const settlements = useMemo(() => calculateSettlements(balances), [balances])
  const totalExpensesInKRW = useMemo(() => getTotalExpensesInKRW(expenses, exchangeRates), [expenses, exchangeRates])

  // 지출에 사용된 통화 목록
  const usedCurrencies = useMemo(() => getUsedCurrencies(expenses), [expenses])

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
  const overlay = useOverlay();
  const [contentHeight, setContentHeight] = useState<number>();

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
    <Box
      display="flex"
      flexDirection="column"
      sx={{ flex: 1, p: 3, bgcolor: 'grey.50', height: contentHeight }}
      ref={(node: HTMLDivElement | null) => {
        if (node) setContentHeight(window.innerHeight - node.getBoundingClientRect().top)
      }}
    >
      {/* 상단 요약 카드 */}
      <Stack direction="row" flex={0} spacing={2} flexWrap="wrap" useFlexGap>
        {/* 총 지출 (원화 환산) */}
        <Paper
          elevation={0}
          sx={theme => ({
            p: 3,
            py: 2,
            background: theme.palette.primary.main,
            color: 'white',
            borderRadius: 3,
          })}
        >
          <Stack alignItems="start" gap={1} height="100%">
            <Typography variant="body2" >
              총 지출
            </Typography>
            <AnimatedCountText
              value={totalExpensesInKRW}
              format={x => formatCurrency(x).padStart(formatCurrency(totalExpensesInKRW).length, '\u2007')}
              variant="h5"
              fontWeight="bold"
            />

          </Stack>
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
                py: 2,
                pb: 1,
                minWidth: 140,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Stack alignItems="start" gap={0.5}>
                <Stack direction="row" spacing={0.5} alignItems="center" >
                  <Typography variant="body2">{member.emoji}</Typography>
                  <Typography variant="body2" fontWeight="medium">{member.name}</Typography>
                </Stack>
                <AnimatedCountText
                  value={balance}
                  format={x => `${balance > 0 ? '+' : ''}${formatCurrency(x).padStart(String(balance).length, ' ')}`}
                  variant="h6"
                  fontWeight="bold"
                  color={balance > 0 ? 'success.main' : balance < 0 ? 'error.main' : 'text.secondary'}
                />
                <Typography variant="caption" color="text.secondary">
                  {balance > 0 ? '받을 돈' : balance < 0 ? '낼 돈' : '정산 완료'}
                </Typography>
              </Stack>
            </Paper>
          )
        })
        }
      </Stack >

      <Stack direction="row" flex={0} padding={2}>
        <Button
          size="small"
          color="info"
          endIcon={<SettingsIcon />}
          onClick={() => {
            overlay.open(({ isOpen, close }) => (
              <Dialog open={isOpen} onClose={close}>
                <DialogTitle>환율 설정</DialogTitle>
                <DialogContent>
                  {usedCurrencies.map(code => {
                    const currentRate = getExchangeRate(code, exchangeRates);
                    const defaultRate = getDefaultExchangeRate(code);
                    return (
                      <ListItem key={code}>
                        <Stack key={code} direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            {getCurrencyName(code)}
                          </Typography>
                          <EditableText
                            variant="body2"
                            fontWeight="medium"
                            value={currentRate ? `${currentRate.toLocaleString()}원` : `${defaultRate.toLocaleString()}원 (기본)`}
                            sx={{ width: 200, textAlign: 'right', 'input': { textAlign: 'right' } }}
                            onSubmit={(value) => {
                              const rate = Number(value.replace(/[^0-9.]/g, ''))
                              if (rate > 0) {
                                const newRates = setExchangeRate(exchangeRates, code as CurrencyCode, rate);
                                updateTrip.mutateAsync({ exchangeRates: newRates })
                              }
                            }}
                            submitOnBlur
                          />
                        </Stack>
                      </ListItem>
                    );
                  })}
                </DialogContent>
                <DialogActions>
                  <Button variant="contained" onClick={close}>확인</Button>
                </DialogActions>
              </Dialog>
            ))
          }}
        >
          환율 설정
        </Button>
      </Stack>

      {/* 메인 컨텐츠 */}
      < Stack direction="row" flex="1 1 100%" height="100px" spacing={3} >
        {/* 왼쪽: 지출 목록 */}
        < Paper
          elevation={0}
          sx={{ flex: 2, p: 3, borderRadius: 3, display: 'flex', flexDirection: 'column' }
          }
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
                              <Typography fontWeight="medium">{expense.description}</Typography>
                              {expense.date && (
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(expense.date)}
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
                                      label={`${member?.emoji} ${member?.name}`}
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
                                      label={`${member?.emoji} ${member?.name}${p.amount === expense.totalAmount ? '' : ` ${formatByCurrencyCode(p.amount, expense.currency)}`}`}
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
                              onClick={() => handleDeleteExpense(expense.id)}
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
          ) : (
            // 경로 뷰
            <Box sx={{ mx: -3, mb: -3, mt: -1 }}>
              <Suspense>
                <RouteExpenseView tripId={tripId} />
              </Suspense>
            </Box>
          )
          }
        </Paper >

        {/* 오른쪽: 정산 현황 */}
        < Paper
          elevation={0}
          sx={{ flex: 1, p: 3, borderRadius: 3, minWidth: 320 }}
        >
          <Typography variant="h6" fontWeight="bold" mb={2}>정산 현황</Typography>

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

                          <AnimatedCountText value={settlement.amount} format={formatCurrency} variant="h6" color="primary.main" fontWeight="bold" />

                        </Stack>
                      </CardContent>
                    </Card>
                  )
                })}
              </Stack>
            </>
          )
          }

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
        </Paper >
      </Stack >
    </Box >
  )
}
