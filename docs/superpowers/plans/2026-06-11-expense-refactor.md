# Expense Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 지출 탭 컴포넌트를 역할별로 분리하고, 정산 계산 로직을 `useExpenseCalculations` 훅으로 추상화한다.

**Architecture:** 모바일은 `ExpenseHeader.mobile`, `ExpenseList.mobile`로 분리해 `ExpenseContent.mobile`을 진입점으로만 남긴다. `useExpenseCalculations`는 `balances`, `settlements`, `totalInKRW`를 한 곳에서 계산해 제공하고, `ExpenseSettlementGuideCard`, `ExpenseMemberSettlements`, `SettlementSummary.desktop`, `SettlementSummary.mobile`이 이를 소비한다. `routeExpenseView.utils.ts`로 `ROUTE_COLORS`, `getRouteColor`, `RoutePath`를 공유해 양쪽 `RouteExpenseView`의 중복을 제거한다.

**Tech Stack:** React 19, TypeScript, MUI 7, TanStack React Query 5

---

## File Structure

```
src/features/trip/trip-expense/
├── useExpenseCalculations.ts         CREATE  — balances/settlements/totalInKRW 계산 훅
├── routeExpenseView.utils.tsx        CREATE  — ROUTE_COLORS, getRouteColor, RoutePath 공유
├── desktop/
│   ├── ExpenseContent.desktop.tsx    MODIFY  — 변경 없음 (이미 분리됨)
│   ├── ExpenseList.desktop.tsx       MODIFY  — 변경 없음
│   ├── ExpenseMemberSettlements.desktop.tsx  MODIFY  — useExpenseCalculations 사용
│   ├── ExpenseSettlementGuideCard.desktop.tsx MODIFY — useExpenseCalculations 사용
│   ├── RouteExpenseView.desktop.tsx  MODIFY  — routeExpenseView.utils 사용
│   └── SettlementSummary.desktop.tsx MODIFY  — useExpenseCalculations 사용
└── mobile/
    ├── ExpenseContent.mobile.tsx     MODIFY  — 진입점만 남김 (탭, 버튼, guard)
    ├── ExpenseHeader.mobile.tsx      CREATE  — 총지출 AnimatedCountText + 환율 EditableText
    ├── ExpenseList.mobile.tsx        CREATE  — 지출 목록 ListItem 렌더링
    ├── RouteExpenseView.mobile.tsx   MODIFY  — routeExpenseView.utils 사용
    └── SettlementSummary.tsx         MODIFY  — useExpenseCalculations 사용
```

---

## Task 1: `useExpenseCalculations` 훅 생성

**Files:**
- Create: `src/features/trip/trip-expense/useExpenseCalculations.ts`

- [ ] **Step 1: 파일 생성**

```ts
// src/features/trip/trip-expense/useExpenseCalculations.ts
import { useMemo } from "react"
import { calculateBalancesInKRW, calculateSettlements, getTotalExpensesInKRW } from "~features/expense/expense.utils"
import { useExpenses } from "~features/expense/useExpenses"
import { useTripMembers } from "../trip-member/useTripMembers"
import { useTrip } from "../useTrip"

export function useExpenseCalculations(tripId: string) {
  const { data: trip } = useTrip(tripId)
  const { data: expenses } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)

  const { exchangeRates } = trip

  const totalInKRW = useMemo(
    () => getTotalExpensesInKRW(expenses, exchangeRates),
    [expenses, exchangeRates]
  )
  const balances = useMemo(
    () => calculateBalancesInKRW(members, expenses, exchangeRates),
    [members, expenses, exchangeRates]
  )
  const settlements = useMemo(() => calculateSettlements(balances), [balances])

  return { totalInKRW, balances, settlements, members, expenses, exchangeRates }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/trip/trip-expense/useExpenseCalculations.ts
git commit -m "feat: useExpenseCalculations 훅 추가"
```

---

## Task 2: `routeExpenseView.utils.tsx` 공유 유틸 생성

**Files:**
- Create: `src/features/trip/trip-expense/routeExpenseView.utils.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// src/features/trip/trip-expense/routeExpenseView.utils.tsx
import { Map } from "~shared/components/Map"
import { useRoadRoute } from "~features/route/road-route/useRoadRoute"

export const ROUTE_COLORS = [
  '#1976d2',
  '#e53935',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00acc1',
] as const

export function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length]
}

interface RoutePathProps {
  waypoints: { lat: number; lng: number }[]
  color: string
  isActive: boolean
}

export function RoutePath({ waypoints, color, isActive }: RoutePathProps) {
  const coordinates = useRoadRoute({ waypoints })

  if (!coordinates || coordinates.length < 2) return null

  return (
    <Map.Path
      coordinates={coordinates}
      strokeColor={color}
      strokeWeight={isActive ? 5 : 3}
      strokeOpacity={isActive ? 1 : 0.4}
    />
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/trip/trip-expense/routeExpenseView.utils.tsx
git commit -m "feat: RouteExpenseView 공유 유틸 추가"
```

---

## Task 3: `RouteExpenseView.desktop.tsx` 중복 제거

**Files:**
- Modify: `src/features/trip/trip-expense/desktop/RouteExpenseView.desktop.tsx`

- [ ] **Step 1: 파일 상단 import 교체 및 중복 코드 제거**

기존 파일에서 아래 코드를 삭제하고 import로 대체한다.

삭제할 코드:
```ts
// 경로별 색상 팔레트
const ROUTE_COLORS = [
  '#1976d2',
  '#e53935',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00acc1',
]

function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length]
}
```

```tsx
interface RoutePathProps {
  waypoints: { lat: number; lng: number }[]
  color: string
  isActive: boolean
}

function RoutePath({ waypoints, color, isActive }: RoutePathProps) {
  const coordinates = useRoadRoute({ waypoints });

  if (!coordinates || coordinates.length < 2) return null;

  return (
    <Map.Path
      coordinates={coordinates}
      strokeColor={color}
      strokeWeight={isActive ? 5 : 3}
      strokeOpacity={isActive ? 1 : 0.4}
    />
  )
}
```

추가할 import:
```ts
import { getRouteColor, RoutePath } from "../routeExpenseView.utils"
```

또한 `useRoadRoute` import도 삭제한다 (더 이상 직접 사용하지 않음).

- [ ] **Step 2: 빌드 확인**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/trip/trip-expense/desktop/RouteExpenseView.desktop.tsx
git commit -m "refactor: RouteExpenseView.desktop ROUTE_COLORS/RoutePath 공유 유틸 사용"
```

---

## Task 4: `RouteExpenseView.mobile.tsx` 중복 제거

**Files:**
- Modify: `src/features/trip/trip-expense/mobile/RouteExpenseView.mobile.tsx`

- [ ] **Step 1: 파일 상단 import 교체 및 중복 코드 제거**

삭제할 코드:
```ts
const ROUTE_COLORS = [
  '#1976d2',
  '#e53935',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00acc1',
]

function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length]
}
```

```tsx
interface RoutePathProps {
  waypoints: { lat: number; lng: number }[];
  color: string
  isActive: boolean
}

function RoutePath({ waypoints, color, isActive }: RoutePathProps) {
  const coordinates = useRoadRoute({ waypoints })

  if (!coordinates || coordinates.length < 2) return null

  return (
    <Map.Path
      coordinates={coordinates}
      strokeColor={color}
      strokeWeight={isActive ? 5 : 3}
      strokeOpacity={isActive ? 1 : 0.4}
    />
  )
}
```

추가할 import:
```ts
import { getRouteColor, RoutePath } from "../routeExpenseView.utils"
```

`useRoadRoute` import도 삭제한다.

- [ ] **Step 2: 빌드 확인**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/trip/trip-expense/mobile/RouteExpenseView.mobile.tsx
git commit -m "refactor: RouteExpenseView.mobile ROUTE_COLORS/RoutePath 공유 유틸 사용"
```

---

## Task 5: desktop 소비자들 `useExpenseCalculations` 사용

**Files:**
- Modify: `src/features/trip/trip-expense/desktop/ExpenseSettlementGuideCard.desktop.tsx`
- Modify: `src/features/trip/trip-expense/desktop/ExpenseMemberSettlements.desktop.tsx`
- Modify: `src/features/trip/trip-expense/desktop/SettlementSummary.desktop.tsx`

- [ ] **Step 1: `ExpenseSettlementGuideCard.desktop.tsx` 수정**

기존:
```ts
import { useExpenses } from "~features/expense/useExpenses"
import { useTripMembers } from "~features/trip/trip-member/useTripMembers"
import { useTrip } from "~features/trip/useTrip"
// ...
const { data: trip } = useTrip(tripId);
const { data: expenses, create } = useExpenses(tripId);
const { data: members } = useTripMembers(tripId);

const balances = useMemo(() => calculateBalancesInKRW(members, expenses, trip.exchangeRates), [members, expenses, trip.exchangeRates])
const settlements = useMemo(() => calculateSettlements(balances), [balances])
```

변경 후:
```ts
import { useExpenseCalculations } from "../useExpenseCalculations"
// calculateBalancesInKRW, calculateSettlements import 제거
// useExpenses, useTripMembers, useTrip import 제거
// ...
const { balances, settlements, members } = useExpenseCalculations(tripId)
```

`useMemo` 두 줄도 삭제한다. `fallbackEmpty` 로직은 그대로 유지한다.

- [ ] **Step 2: `ExpenseMemberSettlements.desktop.tsx` 수정**

기존:
```ts
import { convertToKRW } from "~features/expense/currency";
import { calculateBalancesInKRW, formatCurrency } from "~features/expense/expense.utils";
import { useExpenses } from "~features/expense/useExpenses";
import { useTripMembers } from "~features/trip/trip-member/useTripMembers";
import { useTrip } from "~features/trip/useTrip";
// ...
const { data: trip } = useTrip(tripId)
const { data: expenses, create } = useExpenses(tripId)
const { data: members } = useTripMembers(tripId)

const exchangeRates = trip.exchangeRates

const balances = useMemo(() => calculateBalancesInKRW(members, expenses, exchangeRates), [members, expenses, exchangeRates])
```

변경 후:
```ts
import { convertToKRW } from "~features/expense/currency";
import { formatCurrency } from "~features/expense/expense.utils";
import { useExpenseCalculations } from "../useExpenseCalculations"
// ...
const { balances, members, expenses, exchangeRates } = useExpenseCalculations(tripId)
```

`useMemo` 한 줄 삭제. `paidInKRW`, `owedInKRW` 계산 로직은 컴포넌트 내 표현 목적이므로 그대로 유지.

- [ ] **Step 3: `SettlementSummary.desktop.tsx` 수정**

기존:
```ts
import { useExpenses } from "~features/expense/useExpenses";
import { MemberAvatar } from "~features/trip/trip-member/MemberAvatar";
import { useTripMembers } from "~features/trip/trip-member/useTripMembers";
import { useTrip } from "~features/trip/useTrip";
// ...
const { data: trip } = useTrip(tripId);
const { data: expenses } = useExpenses(tripId);
const { data: members } = useTripMembers(tripId);

const totalExpensesInKRW = useMemo(() => getTotalExpensesInKRW(expenses, trip.exchangeRates), [expenses, trip])
const balances = useMemo(() => calculateBalancesInKRW(members, expenses, trip.exchangeRates), [members, expenses, trip])
```

변경 후:
```ts
import { useExpenseCalculations } from "../useExpenseCalculations"
// useExpenses, useTripMembers, useTrip, getTotalExpensesInKRW, calculateBalancesInKRW import 제거
// ...
const { totalInKRW, balances, members, expenses, exchangeRates } = useExpenseCalculations(tripId)
```

기존 `totalExpensesInKRW` 변수 참조를 `totalInKRW`로 교체. `memberPaidMap` 계산 로직은 표현 목적이므로 유지.

- [ ] **Step 4: 빌드 확인**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/features/trip/trip-expense/desktop/ExpenseSettlementGuideCard.desktop.tsx
git add src/features/trip/trip-expense/desktop/ExpenseMemberSettlements.desktop.tsx
git add src/features/trip/trip-expense/desktop/SettlementSummary.desktop.tsx
git commit -m "refactor: desktop 정산 컴포넌트 useExpenseCalculations 사용"
```

---

## Task 6: `SettlementSummary.tsx` (mobile) `useExpenseCalculations` 사용

**Files:**
- Modify: `src/features/trip/trip-expense/mobile/SettlementSummary.tsx`

- [ ] **Step 1: 수정**

기존:
```ts
import { useExpenses } from '~features/expense/useExpenses'
import { calculateBalancesInKRW, calculateSettlements, formatCurrency } from "../../../expense/expense.utils"
import { useTripMembers } from '../../trip-member/useTripMembers'
import { useTrip } from '../../useTrip'
// ...
const { data: { exchangeRates } } = useTrip(tripId)
const { data: expenses } = useExpenses(tripId);
const { data: members } = useTripMembers(tripId)
const memberMap = new Map(members.map(m => [m.id, m]))
const balances = useMemo(() => calculateBalancesInKRW(members, expenses, exchangeRates), [members, expenses, exchangeRates])
const settlements = useMemo(() => calculateSettlements(balances), [balances])
```

변경 후:
```ts
import { convertToKRW } from '~features/expense/currency'
import { formatCurrency } from '~features/expense/expense.utils'
import { useExpenseCalculations } from "../useExpenseCalculations"
// ...
const { balances, settlements, members, expenses, exchangeRates } = useExpenseCalculations(tripId)
const memberMap = new Map(members.map(m => [m.id, m]))
```

`memberPaidMap` 계산 로직은 유지.

- [ ] **Step 2: 빌드 확인**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/trip/trip-expense/mobile/SettlementSummary.tsx
git commit -m "refactor: SettlementSummary.mobile useExpenseCalculations 사용"
```

---

## Task 7: `ExpenseHeader.mobile.tsx` 생성

**Files:**
- Create: `src/features/trip/trip-expense/mobile/ExpenseHeader.mobile.tsx`

현재 `ExpenseContent.mobile.tsx` 90~160줄의 헤더 영역(primary 배경, 총지출, 환율 편집)을 분리한다.

- [ ] **Step 1: 파일 생성**

```tsx
// src/features/trip/trip-expense/mobile/ExpenseHeader.mobile.tsx
import { Box, InputAdornment, Stack, TextField, Typography } from "@mui/material"
import { EditableText } from "~shared/components/EditableText"
import { AnimatedCountText } from "~shared/components/animation/AnimatedCountText"
import { getDefaultExchangeRate, getExchangeRate, getUsedCurrencies, setExchangeRate, type CurrencyCode } from "~features/expense/currency"
import { formatCurrency } from "~features/expense/expense.utils"
import { useExpenseCalculations } from "../useExpenseCalculations"
import { useTrip } from "../../useTrip"
import { useExpenses } from "~features/expense/useExpenses"

interface Props {
  tripId: string
}

export function ExpenseHeader({ tripId }: Props) {
  const { data: trip, update: updateTrip } = useTrip(tripId)
  const { data: expenses } = useExpenses(tripId)
  const { totalInKRW } = useExpenseCalculations(tripId)

  const { exchangeRates } = trip
  const usedCurrencies = getUsedCurrencies(expenses)

  return (
    <Stack
      direction="row"
      gap={1}
      justifyContent="space-between"
      alignItems="end"
      flex="0 0 auto"
      sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', color: 'white' }}
    >
      <Stack direction="column" alignItems="start" flex="1">
        <Typography variant="caption">총 지출</Typography>
        <AnimatedCountText
          value={totalInKRW}
          format={formatCurrency}
          variant="h5"
          delay={100}
          duration={1000}
          fontWeight="bold"
        />
      </Stack>

      {trip.isOverseas && usedCurrencies.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="end" justifyContent="end">
          {usedCurrencies.map(code => {
            const currentRate = getExchangeRate(code, exchangeRates)
            const defaultRate = getDefaultExchangeRate(code)

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
                    const newRates = setExchangeRate(exchangeRates, code as CurrencyCode, rate)
                    updateTrip.mutateAsync({ exchangeRates: newRates })
                  }
                }}
                submitOnBlur
              />
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/trip/trip-expense/mobile/ExpenseHeader.mobile.tsx
git commit -m "feat: ExpenseHeader.mobile 컴포넌트 분리"
```

---

## Task 8: `ExpenseList.mobile.tsx` 생성

**Files:**
- Create: `src/features/trip/trip-expense/mobile/ExpenseList.mobile.tsx`

현재 `ExpenseContent.mobile.tsx` `list` 케이스 내부의 `expenses.map` 블록을 분리한다.

- [ ] **Step 1: 파일 생성**

```tsx
// src/features/trip/trip-expense/mobile/ExpenseList.mobile.tsx
import { Delete, Edit } from '@mui/icons-material'
import GroupIcon from '@mui/icons-material/Group'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PaymentIcon from '@mui/icons-material/Payment'
import PlaceIcon from '@mui/icons-material/Place'
import { Stack, Typography } from "@mui/material"
import { useMemo } from "react"
import { formatByCurrencyCode } from "~features/expense/currency"
import { useExpenses } from "~features/expense/useExpenses"
import { ListItem } from "~shared/components/ListItem"
import { PopMenu } from "~shared/components/PopMenu"
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog"
import { formatShortDate } from "~shared/utils/formats"
import { useTripMembers } from "../../trip-member/useTripMembers"
import type { Expense } from "~features/expense/expense.types"
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
```

- [ ] **Step 2: 빌드 확인**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/trip/trip-expense/mobile/ExpenseList.mobile.tsx
git commit -m "feat: ExpenseList.mobile 컴포넌트 분리"
```

---

## Task 9: `ExpenseContent.mobile.tsx` 슬림화

**Files:**
- Modify: `src/features/trip/trip-expense/mobile/ExpenseContent.mobile.tsx`

- [ ] **Step 1: 파일 전체 교체**

기존 파일을 아래로 교체한다. `totalExpensesInKRW`, `usedCurrencies`, `EditableText` 환율 블록, `expenses.map` 블록이 모두 제거된다.

```tsx
// src/features/trip/trip-expense/mobile/ExpenseContent.mobile.tsx
import AddIcon from '@mui/icons-material/Add'
import RouteIcon from '@mui/icons-material/Route'
import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material"
import { Suspense, useState } from "react"
import { SwitchCase } from '~shared/components/SwitchCase'
import { BottomSheet } from "~shared/components/bottom-sheet/BottomSheet"
import { useOverlay } from "~shared/hooks/useOverlay"
import { useExpenses } from "~features/expense/useExpenses"
import { useTripMembers } from "../../trip-member/useTripMembers"
import { useExpenseFormBottomSheet } from "../useExpenseFormOverlay"
import { ExpenseHeader } from "./ExpenseHeader.mobile"
import { ExpenseList } from "./ExpenseList.mobile"
import { RouteExpenseViewMobile } from "./RouteExpenseView.mobile"
import { SettlementSummary } from "./SettlementSummary"

interface Props {
  tripId: string
}

type SubTab = 'list' | 'settlement'

export function preload(tripId: string) {
  useExpenses.prefetch(tripId);
  useTripMembers.prefetch(tripId);
}

export default function ExpenseContent({ tripId }: Props) {
  const { data: members } = useTripMembers(tripId)
  const { create } = useExpenses(tripId)

  const overlay = useOverlay()
  const [currentSubTab, selectSubTab] = useState<SubTab>('list')

  const formBottomSheet = useExpenseFormBottomSheet(tripId)

  const handleAddExpense = async () => {
    const data = await formBottomSheet.open()
    if (data) create(data)
  }

  const handleOpenRouteExpense = () => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onClose={close} snapPoints={[0.95]} defaultSnapIndex={0}>
        <Suspense>
          <RouteExpenseViewMobile tripId={tripId} />
        </Suspense>
      </BottomSheet>
    ))
  }

  const hasMember = members.length > 0

  return (
    <Box sx={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ExpenseHeader tripId={tripId} />

      <Tabs
        value={currentSubTab}
        onChange={(_, v) => selectSubTab(v)}
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

      {!hasMember ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Typography color="text.secondary" textAlign="center">
            먼저 기본 정보 탭에서 인원을 추가해주세요
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, height: '100%' }}>
          <SwitchCase
            value={currentSubTab}
            cases={{
              list: () => <ExpenseList tripId={tripId} />,
              settlement: <SettlementSummary tripId={tripId} />
            }}
          />
        </Box>
      )}

      <Stack direction="row" spacing={1} p={1}>
        <Button
          size="large"
          variant="outlined"
          onClick={handleOpenRouteExpense}
          startIcon={<RouteIcon />}
          disabled={!hasMember}
          sx={{ flex: 1 }}
        >
          경로 기반
        </Button>
        <Button
          size="large"
          variant="contained"
          onClick={handleAddExpense}
          startIcon={<AddIcon />}
          disabled={!hasMember}
          sx={{ flex: 1 }}
        >
          지출 추가
        </Button>
      </Stack>
    </Box>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
yarn tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/trip/trip-expense/mobile/ExpenseContent.mobile.tsx
git commit -m "refactor: ExpenseContent.mobile 슬림화 — ExpenseHeader/ExpenseList 분리"
```

---

## Self-Review

### Spec coverage
- [x] 모바일 컴포넌트 분리 (ExpenseHeader, ExpenseList) — Task 7, 8, 9
- [x] useExpenseCalculations 훅 — Task 1
- [x] routeExpenseView.utils 공유 — Task 2, 3, 4
- [x] desktop 소비자 refactor — Task 5
- [x] mobile SettlementSummary refactor — Task 6

### Placeholder scan
- 모든 태스크에 실제 코드 포함됨. TBD 없음.

### Type consistency
- `useExpenseCalculations`가 반환하는 `totalInKRW` 변수명이 `SettlementSummary.desktop`에서 기존 `totalExpensesInKRW`를 대체함 — Task 5 Step 3에 명시됨.
- `ExpenseList.mobile`의 `handleEditExpense`는 `Expense` 타입을 직접 받음 — `expense.types.ts`에서 import.
