import { Delete, Edit } from '@mui/icons-material'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PaymentIcon from '@mui/icons-material/Payment'
import RouteIcon from '@mui/icons-material/Route'
import { Box, Button, InputAdornment, Stack, Tab, Tabs, TextField, Typography } from "@mui/material"
import { Suspense, useMemo, useState } from "react"
import type { Expense } from '~app/expense/expense.types'
import { PopMenu } from '~shared/components/PopMenu'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { BottomSheet } from "../../../shared/components/BottomSheet"
import { EditableText } from "../../../shared/components/EditableText"
import { ListItem } from "../../../shared/components/ListItem"
import { useOverlay } from "../../../shared/hooks/useOverlay"
import { formatDate } from "../../../shared/utils/formats"
import { formatByCurrencyCode, getDefaultExchangeRate, getExchangeRate, getUsedCurrencies, setExchangeRate, type CurrencyCode } from "../../expense/currency"
import {
  calculateBalancesInKRW,
  calculateSettlements,
  formatCurrency,
  getTotalExpensesInKRW
} from "../../expense/expense.utils"
import { useExpenses } from "../../expense/useExpenses"
import { useTripMembers } from "../trip-member/useTripMembers"
import { useTrip } from "../useTrip"
import { AnimatedCountText } from './AnimatedCountText'
import { RouteExpenseViewMobile } from "./RouteExpenseView.mobile"
import { SettlementSummary } from "./SettlementSummary"
import { useExpenseFormBottomSheet } from './useExpenseFormOverlay'
import PlaceIcon from '@mui/icons-material/Place';
import GroupIcon from '@mui/icons-material/Group';

interface Props {
  tripId: string
}

type SubTab = 'list' | 'settlement'

export function ExpenseContent({ tripId }: Props) {
  const { data: trip, update: updateTrip } = useTrip(tripId)
  const { data: expenses, create, update, remove } = useExpenses(tripId)
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

  const exchangeRates = trip.exchangeRates

  // 원화 환산 기준 계산
  const balances = useMemo(() => calculateBalancesInKRW(members, expenses, exchangeRates), [members, expenses, exchangeRates])
  const settlements = useMemo(() => calculateSettlements(balances), [balances])
  const totalExpensesInKRW = useMemo(() => getTotalExpensesInKRW(expenses, exchangeRates), [expenses, exchangeRates])

  // 지출에 사용된 통화 목록
  const usedCurrencies = useMemo(() => getUsedCurrencies(expenses), [expenses])

  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members])

  const formBottomSheet = useExpenseFormBottomSheet(tripId);
  const handleAddExpense = async () => {
    const data = await formBottomSheet.open();
    if (data) create(data)
  }
  const handleEditExpense = async (expense: Expense) => {
    const data = await formBottomSheet.open({
      defaultValues: expense,
    });
    if (data) update({ expenseId: expense.id, data });
  }

  const confirm = useConfirmDialog();

  return (
    <Box sx={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* 총액 표시 (원화 환산) */}
      <Stack direction="row" gap={1} justifyContent="space-between" alignItems="end" flex="0 0 auto" sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', color: 'white' }}>
        <Stack direction="column" alignItems="start" flex="1">
          <Typography variant="caption">총 지출</Typography>
          <AnimatedCountText
            value={totalExpensesInKRW}
            format={formatCurrency}
            variant="h5"
            delay={100}
            duration={1000}
            fontWeight="bold"
          />

        </Stack>
        {trip.isOverseas && usedCurrencies.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="end" justifyContent="end" >
            {usedCurrencies.map(code => {
              const currentRate = getExchangeRate(code, exchangeRates);
              const defaultRate = getDefaultExchangeRate(code);

              return (
                <EditableText
                  key={code}
                  variant="caption"
                  fontWeight="medium"
                  value={currentRate ?? defaultRate}
                  format={value => `${code} ${value.toLocaleString()}원`}
                  dismissible={false}
                  sx={{
                    fontSize: 11,
                    '.editable-text': { fontSize: 'inherit', textDecoration: 'underline' },
                    '.editable-text-field': { fontSize: 'inherit' }
                  }}
                  endIcon={null}
                  renderEditField={props => (
                    <Box>
                      <TextField
                        variant='standard'
                        size="small"
                        slotProps={{
                          htmlInput: { sx: { color: '#fff', textAlign: 'right', marginBottom: -0.5 } },
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <Typography variant="caption" color="#fff">원</Typography>
                              </InputAdornment>
                            ),
                            sx: { '&::before': { borderColor: '#fff', zIndex: 999 } }
                          },
                        }}
                        sx={{ width: 60 }}
                        {...props}
                      />
                    </Box>
                  )}
                  onSubmit={(value) => {
                    const rate = Number(value.replace(/[^0-9.]/g, ''))
                    if (rate > 0) {
                      const newRates = setExchangeRate(exchangeRates, code as CurrencyCode, rate);
                      updateTrip.mutateAsync({ exchangeRates: newRates })
                    }
                  }}
                  submitOnBlur
                />
              );
            })}
          </Stack>
        )}
      </Stack>

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
          <SwitchCase
            value={subTab}
            cases={{
              list: () => (
                <Stack spacing={1.5}>
                  {expenses.map((expense) => {
                    const splitedAmount = Math.ceil(expense.totalAmount / expense.splitAmong.length);
                    const peopleAmount = expense.payments.reduce<Record<string, number>>((acc, item) => ({
                      ...acc,
                      [item.memberId]: (acc[item.memberId] ?? 0) + item.amount
                    }), {});

                    const is엔빵 = expense.splitAmong.every(memberId => {
                      if (peopleAmount[memberId] == null) return false;
                      return peopleAmount[memberId] === splitedAmount;
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
                                    remove(expense.id);
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
                          <Box flex={1}>
                            <ListItem.Title mb={0.5}>
                              {expense.date && `[${formatDate(expense.date)}] `}
                              {expense.description}
                            </ListItem.Title>
                            {expense.place && (
                              <ListItem.Text leftAddon={<PlaceIcon sx={{ fontSize: 12, width: 14, }} />}>
                                {expense.place.name}
                              </ListItem.Text>
                            )}
                            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                              <GroupIcon sx={{ fontSize: 14 }} />
                              {expense.splitAmong.map(id => {
                                const member = memberMap.get(id);
                                return (
                                  <ListItem.Text key={id} variant="caption">
                                    {member?.name}
                                  </ListItem.Text>
                                )
                              })}
                            </Stack>
                          </Box>
                          <Stack direction="row" alignItems="center">
                            {!is엔빵 && (
                              <Stack direction="row" gap={0.5} alignItems="center">
                                <PaymentIcon sx={{ fontSize: 12 }} />
                                <Stack>
                                  {expense.payments.map(p => {
                                    const member = memberMap.get(p.memberId);
                                    if (member == null) return null;

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

              ),
              settlement: (
                <SettlementSummary
                  tripId={tripId}
                  balances={balances}
                  settlements={settlements}
                />
              )
            }}
          />

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
