import { queryClient } from '~app/query-client';
import AddIcon from '@mui/icons-material/Add'
import RouteIcon from '@mui/icons-material/Route'
import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material"
import { Suspense, useState } from "react"
import { SwitchCase } from '~shared/components/SwitchCase'
import { BottomSheet } from "~shared/components/bottom-sheet/BottomSheet"
import { useOverlay } from "~shared/hooks/useOverlay"
import { useExpenses } from '@waylog/domains/modules/expense'
import { useTripMembers } from '@waylog/domains/modules/trip-member'
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
  queryClient.prefetchQuery(useExpenses.query(tripId));
  queryClient.prefetchQuery(useTripMembers.query(tripId));
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
