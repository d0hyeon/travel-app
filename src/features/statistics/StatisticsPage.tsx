import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Box, CircularProgress, LinearProgress, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { StatisticsCurrencySection } from './StatisticsCurrencySection'
import { StatisticsExpenseSection } from './StatisticsExpenseSection'
import { StatisticsOverviewSection } from './StatisticsOverviewSection'
import { useStatisticsSummary } from './statistics-expense/useStatisticsSummary'
import { Suspense } from 'react'

type StatisticsTab = 'overview' | 'expense' | 'currency'

export default function StatisticsPage() {

  const [currentTab, setCurrentTab] = useQueryParamState<StatisticsTab>('stats-tab', {
    defaultValue: 'overview',
  })

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      <Box
        position="sticky"
        top={0}

        py={1}
        pb={0}
        width="100%"
        bgcolor="background.paper"
        zIndex={10}
      >
        <Stack gap={1.25} >
          <Stack direction="row" alignItems="center" gap={1} px={2}>
            <ReceiptLongIcon color="primary" fontSize="small" />
            <Typography variant="h6" fontWeight={800}>
              통계
            </Typography>
          </Stack>

          <Tabs
            value={currentTab}
            onChange={(_, value: StatisticsTab) => setCurrentTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              borderBottom: '1px solid #ddd',
            }}
          >
            <Tab value="overview" label="개요" />
            <Tab value="expense" label="지출" />
            <Tab value="currency" label="통화" />
          </Tabs>
        </Stack>
      </Box>

      <Suspense fallback={<Stack width="100%" alignItems="center" paddingY={10}><CircularProgress /></Stack>}>
        <StatisticTabContent value={currentTab} />
      </Suspense>
    </Box>
  )
}

type Props = {
  value: StatisticsTab;
}

function StatisticTabContent({ value }: Props) {
  const summary = useStatisticsSummary()

  return (
    <Box px={2} py={2} flex={1} overflow="auto">
      <Stack gap={3}>
        {summary.travelSummaries.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="body1" color="text.secondary">
              아직 기록된 지출이 없어요.
            </Typography>
          </Box>
        ) : null}

        {summary.travelSummaries.length > 0 && value === 'overview' ? (
          <StatisticsOverviewSection summary={summary} />
        ) : null}

        {summary.travelSummaries.length > 0 && value === 'expense' ? (
          <StatisticsExpenseSection summary={summary} />
        ) : null}

        {summary.travelSummaries.length > 0 && value === 'currency' ? (
          <StatisticsCurrencySection summary={summary} />
        ) : null}
      </Stack>
    </Box>
  )
}