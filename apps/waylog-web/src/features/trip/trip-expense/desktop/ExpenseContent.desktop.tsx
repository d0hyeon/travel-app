import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  type BoxProps,
  type PaperProps,
  type StackProps
} from "@mui/material"
import { Suspense, useState, type ReactElement } from "react"
import { SwitchCase } from '~shared/components/SwitchCase'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { useExpenses } from "../../../expense/useExpenses"
import { useTripMembers } from "../../trip-member/useTripMembers"
import { useTrip } from "@waylog/domains/trip"
import { TripExchangeRageSettingButton } from '../TripExchangeRateSettingButton'
import { useExpenseFormOverlay } from "../useExpenseFormOverlay"
import { ExpenseList } from './ExpenseList.desktop'
import { ExpenseMemberSettlements } from './ExpenseMemberSettlements.desktop'
import { ExpenseSettlementGuideCard } from './ExpenseSettlementGuideCard.desktop'
import { RouteExpenseView } from "./RouteExpenseView.desktop"
import { SettlementSummary } from './SettlementSummary.desktop'

interface Props {
  tripId: string
}

type ViewMode = 'list' | 'route'

export function ExpenseContent({ tripId }: Props) {
  const [viewMode, setViewMode] = useQueryParamState<ViewMode>('espense-view', {
    defaultValue: 'list'
  })

  const { data: trip } = useTrip(tripId)
  const { create } = useExpenses(tripId)
  const { data: members } = useTripMembers(tripId)
  const expenseFormOverlay = useExpenseFormOverlay(tripId)

  const handleAddExpense = async () => {
    const data = await expenseFormOverlay.open({ title: '지출 추가' });
    if (data) create(data);
  }

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
    <Container height={contentHeight}>
      <SettlementSummary tripId={tripId} />
      <Stack direction="row" flex={0} padding={1}>
        {trip.isOverseas && <TripExchangeRageSettingButton tripId={tripId} />}
      </Stack>

      <Contents
        ref={(node: HTMLDivElement) => {
          if (node) setContentHeight(window.innerHeight - node.getBoundingClientRect().top - 48)
        }}
      >
        <Contents.Main>
          <SectionHeader
            rightElement={viewMode === 'list' ? (
              <Button
                variant="contained"
                size="small"
                onClick={handleAddExpense}
                sx={{ borderRadius: 2 }}
              >
                지출 추가
              </Button>
            ) : undefined}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6" >지출 내역</Typography>
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
          </SectionHeader>
          <SwitchCase
            value={viewMode}
            cases={{
              list: <ExpenseList tripId={tripId} />,
              route: (
                <Box height="100%" sx={{ mx: -3, mb: -3, mt: -1 }}>
                  <Suspense>
                    <RouteExpenseView tripId={tripId} />
                  </Suspense>
                </Box>
              )
            }}
          />
        </Contents.Main>
        <Contents.Side>
          <Typography variant="h6" mb={2}>정산 현황</Typography>

          <section>
            <Typography variant="body2" color="text.secondary" mb={2}>
              아래와 같이 송금하면 정산이 완료됩니다
            </Typography>
            <ExpenseSettlementGuideCard tripId={tripId} />
          </section>
          <Divider sx={{ my: 3 }} />
          <section>
            {/* 개인별 상세 */}
            <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
              개인별 상세
            </Typography>
            <ExpenseMemberSettlements tripId={trip.id} />
          </section>
        </Contents.Side>
      </Contents>
    </Container >
  )
}


function Container(props: BoxProps<'div'>) {
  return (
    <Box display="flex"
      flexDirection="column"
      flex={1}
      p={2}
      bgcolor="grey.50"
      {...props}
    />
  )
}

function Contents(props: StackProps) {
  return (
    <Stack direction="row" minHeight={0} spacing={3} {...props} />
  )
}
Contents.Main = (props: PaperProps) => {
  return (
    <Paper
      elevation={0}
      sx={{ flex: 2, p: 3, borderRadius: 3, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
      {...props}
    />
  )
}

Contents.Side = (props: PaperProps) => {
  return (
    <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 3, minWidth: 320 }} {...props} />
  )
}

function SectionHeader({ rightElement, children, ...props }: StackProps & { rightElement?: ReactElement }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} {...props}>
      {children}
      {rightElement}
    </Stack>
  )
}